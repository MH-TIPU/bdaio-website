// Environment for the unit suite.
//
// Nothing here touches a database: these values exist because the modules under
// test read them at import time (the Prisma client is constructed on import of
// `lib/db`, and `emailBucket` keys its HMAC on AUTH_SECRET). Fixed values rather
// than the developer's real `.env`, so a test cannot depend on a local secret
// and quietly pass only on one machine.
process.env.DATABASE_URL ??= "postgresql://localhost:5432/bdaio_test";
process.env.AUTH_SECRET ??= "test-secret-not-used-for-anything-real";
process.env.APP_URL ??= "https://bdaio.example";
