"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth/dal";
import { queueMail } from "@/lib/email/queue";
import { registrationConfirmationEmail } from "@/lib/email/templates";
import { notify } from "@/lib/notifications/notify";
import {
  eligibilityProblems,
  isFull,
  seatsTaken,
  windowState,
  WINDOW_MESSAGES,
} from "@/lib/events/registration";

export type RegistrationState =
  | { ok: true; status: "APPLIED" | "WAITLISTED"; message: string }
  | { ok: false; message: string }
  | undefined;

export async function registerForEvent(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  const roundId = String(formData.get("roundId") ?? "") || null;

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { program: { select: { isExternal: true, title: true } } },
  });
  if (!event) return { ok: false, message: "That event no longer exists." };

  const round = roundId
    ? await db.round.findUnique({ where: { id: roundId } })
    : null;
  if (roundId && (!round || round.eventId !== event.id)) {
    return { ok: false, message: "That round is not part of this event." };
  }

  // Rounds may carry their own window; otherwise the event's applies.
  const state = windowState(event, {
    opensAt: round?.regOpensAt ?? event.regOpensAt,
    closesAt: round?.regClosesAt ?? event.regClosesAt,
  });
  if (state !== "open") {
    return { ok: false, message: WINDOW_MESSAGES[state] };
  }

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: {
      dateOfBirth: true,
      institutionId: true,
      guardian: { select: { id: true } },
    },
  });

  const problems = eligibilityProblems({
    emailVerified: Boolean(user.emailVerifiedAt),
    profile,
    eventType: event.type,
  });
  if (problems.length) {
    return { ok: false, message: problems[0].message };
  }

  const existing = await db.registration.findFirst({
    where: { userId: user.id, eventId: event.id, roundId },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return { ok: false, message: "You have already registered for this." };
  }

  // Capacity is counted at the event level; a full event puts entrants on a
  // waitlist rather than turning them away.
  const [applied, approved] = await Promise.all([
    db.registration.count({ where: { eventId: event.id, status: "APPLIED" } }),
    db.registration.count({ where: { eventId: event.id, status: "APPROVED" } }),
  ]);
  const full = isFull(event.capacity, seatsTaken({ applied, approved }));
  const status = full ? "WAITLISTED" : "APPLIED";

  if (existing) {
    await db.registration.update({
      where: { id: existing.id },
      data: { status },
    });
  } else {
    await db.registration.create({
      data: { userId: user.id, eventId: event.id, roundId, status },
    });
  }

  await logActivity({
    userId: user.id,
    action: full ? "registration.waitlisted" : "registration.created",
    entityType: "Event",
    entityId: event.id,
    metadata: { eventSlug: event.slug, roundId },
  });

  await notify({
    userId: user.id,
    type: full ? "registration.waitlisted" : "registration.confirmed",
    title: full
      ? `Waitlisted for ${event.title}`
      : `Registered for ${event.title}`,
    body: round?.name ?? undefined,
    href: "/dashboard/registrations",
  });

  await queueMail(
    registrationConfirmationEmail(user.email, {
      eventTitle: event.title,
      roundName: round?.name ?? null,
      waitlisted: full,
      startsAt: event.startsAt,
      venue: event.venue,
    }),
  );

  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/dashboard/registrations");

  return {
    ok: true,
    status,
    message: full
      ? "This event is full — you have been added to the waitlist and we will contact you if a place opens."
      : "You are registered. A confirmation email is on its way.",
  };
}

export async function withdrawRegistration(formData: FormData): Promise<void> {
  const user = await requireUser();
  const registrationId = String(formData.get("registrationId") ?? "");

  // Scoped to the owner so one user can never withdraw another's entry.
  const registration = await db.registration.findFirst({
    where: { id: registrationId, userId: user.id },
    include: { event: { select: { slug: true } } },
  });
  if (!registration) return;

  await db.registration.update({
    where: { id: registration.id },
    data: { status: "WITHDRAWN" },
  });

  await logActivity({
    userId: user.id,
    action: "registration.withdrawn",
    entityType: "Registration",
    entityId: registration.id,
  });

  revalidatePath(`/events/${registration.event.slug}`);
  revalidatePath("/dashboard/registrations");
}
