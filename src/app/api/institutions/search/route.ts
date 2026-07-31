import { db } from "@/lib/db";

/**
 * Institution suggestions for the profile and registration forms.
 *
 * Scoped to a district when one is given, because that is what makes the list
 * short enough to be useful — a student picking "Dhaka" should see Dhaka
 * institutions, not all 64 districts' worth.
 *
 * Only APPROVED institutions are ever returned, so this cannot be used to
 * discover pending submissions.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const district = (url.searchParams.get("district") ?? "").trim();
  const division = (url.searchParams.get("division") ?? "").trim();

  const institutions = await db.institution.findMany({
    where: {
      status: "APPROVED",
      ...(district ? { district } : division ? { division } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nameBn: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 25,
    select: {
      id: true,
      name: true,
      nameBn: true,
      district: true,
      type: true,
      verified: true,
    },
  });

  return Response.json(
    { institutions },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
