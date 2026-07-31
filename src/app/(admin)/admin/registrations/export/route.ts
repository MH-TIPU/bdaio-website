import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import type { RegistrationStatus } from "@/generated/prisma/enums";

const STATUSES = [
  "APPLIED",
  "APPROVED",
  "WAITLISTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

/** RFC4180 quoting, plus a guard against spreadsheet formula injection. */
function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  // Registration data is personal information — admins only.
  await requireRole("ADMIN");

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const eventId = url.searchParams.get("eventId") ?? "";

  const registrations = await db.registration.findMany({
    where: {
      ...(STATUSES.includes(status as (typeof STATUSES)[number])
        ? { status: status as RegistrationStatus }
        : {}),
      ...(eventId ? { eventId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          profile: {
            select: {
              fullName: true,
              phone: true,
              presentDivision: true,
              presentDistrict: true,
              presentUpazila: true,
              classGrade: true,
              dateOfBirth: true,
              institution: { select: { name: true } },
              guardian: { select: { name: true, phone: true } },
            },
          },
        },
      },
      event: { select: { title: true } },
      round: { select: { name: true } },
    },
  });

  const header = [
    "Registered at",
    "Status",
    "Event",
    "Round",
    "Full name",
    "Email",
    "Phone",
    "Date of birth",
    "Institution",
    "Class",
    "Division",
    "District",
    "Sub-district",
    "Guardian name",
    "Guardian phone",
  ];

  const rows = registrations.map((r) => {
    const p = r.user.profile;
    return [
      r.createdAt.toISOString(),
      r.status,
      r.event.title,
      r.round?.name ?? "",
      p?.fullName ?? "",
      r.user.email,
      p?.phone ?? "",
      p?.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
      p?.institution?.name ?? "",
      p?.classGrade ?? "",
      p?.presentDivision ?? "",
      p?.presentDistrict ?? "",
      p?.presentUpazila ?? "",
      p?.guardian?.name ?? "",
      p?.guardian?.phone ?? "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bdaio-registrations-${stamp}.csv"`,
      // Personal data must never be cached by proxies or the browser.
      "Cache-Control": "no-store, private",
    },
  });
}
