"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logActivity, requireRole, requireUser } from "@/lib/auth/dal";
import { certificateSerial } from "@/lib/certificates/pdf";
import { notify } from "@/lib/notifications/notify";
import { grantBadge } from "@/lib/community/badges";

/**
 * Issues certificates to every approved participant of an event that does not
 * already have one. Idempotent: re-running only fills the gaps.
 */
export async function issueEventCertificates(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const eventId = String(formData.get("eventId") ?? "");
  const type = String(formData.get("type") ?? "PARTICIPATION");
  if (!["PARTICIPATION", "MERIT", "MEDAL", "APPRECIATION"].includes(type)) return;

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, year: true },
  });
  if (!event) return;

  const registrations = await db.registration.findMany({
    where: { eventId: event.id, status: "APPROVED" },
    include: {
      user: { select: { id: true, profile: { select: { fullName: true } } } },
    },
  });

  let issued = 0;
  for (const registration of registrations) {
    const existing = await db.certificate.findFirst({
      where: { userId: registration.user.id, eventId: event.id },
      select: { id: true },
    });
    if (existing) continue;

    await db.certificate.create({
      data: {
        serial: certificateSerial(event.year, randomBytes(4).toString("hex")),
        userId: registration.user.id,
        eventId: event.id,
        type: type as "PARTICIPATION" | "MERIT" | "MEDAL" | "APPRECIATION",
        title:
          type === "MEDAL"
            ? "Certificate of Achievement"
            : type === "MERIT"
              ? "Certificate of Merit"
              : type === "APPRECIATION"
                ? "Certificate of Appreciation"
                : "Certificate of Participation",
        // Snapshot the name: later profile edits must not rewrite history.
        recipientName: registration.user.profile?.fullName ?? "BdAIO Participant",
        issuedById: admin.id,
      },
    });

    await grantBadge(
      registration.user.id,
      type === "MEDAL" ? "MEDAL" : "PARTICIPATION",
      event.id,
    );

    await notify({
      userId: registration.user.id,
      type: "certificate.issued",
      title: "Your certificate is ready",
      body: `${event.title} — download it from your dashboard.`,
      href: "/dashboard/certificates",
    });

    issued += 1;
  }

  await logActivity({
    userId: admin.id,
    action: "admin.certificates.issued",
    entityType: "Event",
    entityId: event.id,
    metadata: { count: issued, type },
  });

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");
}

export async function revokeCertificate(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("certificateId") ?? "");

  const certificate = await db.certificate.findUnique({
    where: { id },
    select: { id: true, revokedAt: true },
  });
  if (!certificate) return;

  await db.certificate.update({
    where: { id },
    // Revocation is reversible and keeps the record for audit purposes.
    data: { revokedAt: certificate.revokedAt ? null : new Date() },
  });

  await logActivity({
    userId: admin.id,
    action: certificate.revokedAt ? "admin.certificate.restored" : "admin.certificate.revoked",
    entityType: "Certificate",
    entityId: id,
  });

  revalidatePath("/admin/certificates");
  revalidatePath("/dashboard/certificates");
}

// --- Notifications ---------------------------------------------------------

export async function markNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("notificationId") ?? "");
  // Owner-scoped so one user cannot touch another's notifications.
  await db.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
}
