import { getCurrentUser } from "@/lib/auth/dal";

/**
 * The header's view of who you are, and nothing else.
 *
 * This exists so the public layout does not have to read the session. A cookie
 * read in a layout opts every route beneath it out of static rendering, which
 * is what kept the whole public site `ƒ (Dynamic)` and uncached — see §3 of
 * docs/OPS.md. Moving the read here lets the pages be prerendered and
 * revalidated, and the header fill itself in afterwards.
 *
 * **The response body is the reason the pages above it are safe to cache.**
 * Nothing user-specific may travel in the cached HTML, so this is the only
 * place it travels, and it must never itself be cached:
 *
 *  - `force-dynamic` because it reads a cookie, and so that no build-time
 *    prerender of an empty session can be served to a signed-in visitor.
 *  - `no-store, private` for nginx and anything else between us and the
 *    browser. `location /` in docs/OPS.md §4 has no `proxy_cache` today; this
 *    header is what keeps that from becoming a session leak if one is ever
 *    added.
 *
 * The shape is deliberately narrower than `getCurrentUser()` returns — the
 * header needs a name, a photo, a role and a handle. Session id, expiry, email
 * verification state and institution stay on the server, because a field that
 * is not sent cannot be read out of a browser cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  // Signed out is a normal answer, not an error: the header renders its
  // signed-out state and a 401 would just make that look like a failure.
  if (!user) {
    return Response.json(
      { user: null },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  }

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
          ? {
              id: user.profile.id,
              handle: user.profile.handle,
              fullName: user.profile.fullName,
              photo: user.profile.photo,
              visibility: user.profile.visibility,
            }
          : null,
      },
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
