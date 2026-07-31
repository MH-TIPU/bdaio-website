// Dependency-free auth constants.
//
// Kept separate from session.ts on purpose: `src/proxy.ts` runs on every
// request and must not pull in the database/jose/server-only module graph.
export const SESSION_COOKIE = "bdaio_session";
export const SESSION_DAYS = 30;
