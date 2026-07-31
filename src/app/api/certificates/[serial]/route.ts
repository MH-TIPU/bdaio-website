import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { renderCertificate } from "@/lib/certificates/pdf";
import { appUrl } from "@/lib/email/mailer";

// Streams the certificate PDF. Only the holder — or an admin — may download it,
// and a revoked certificate is never served.

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/certificates/[serial]">,
) {
  const { serial } = await ctx.params;

  const certificate = await db.certificate.findUnique({
    where: { serial },
    include: { event: { select: { title: true } } },
  });
  if (!certificate) return new Response("Not found", { status: 404 });
  if (certificate.revokedAt) return new Response("Gone", { status: 410 });

  const user = await getCurrentUser();
  const isOwner = user?.id === certificate.userId;
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  if (!isOwner && !isStaff) {
    // Don't reveal that the serial exists to someone not entitled to it.
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderCertificate({
    serial: certificate.serial,
    recipientName: certificate.recipientName,
    title: certificate.title,
    detail: certificate.detail,
    eventTitle: certificate.event?.title ?? null,
    issuedAt: certificate.issuedAt,
    verifyUrl: appUrl(`/verify/${certificate.serial}`),
  });

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bdaio-${certificate.serial}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
