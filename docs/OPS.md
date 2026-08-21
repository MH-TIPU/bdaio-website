# BdAIO Platform — Operations Runbook

> How this app is provisioned, deployed, backed up, and recovered. Written for
> whoever is on the server at 2am, which may be a version of me that has
> forgotten everything.
>
> **Status:** the app is built through Phase 7. **The production server is not
> provisioned yet** — the Phase 0 "outstanding" item. Everything below is the
> intended setup; treat the provisioning sections as a checklist to execute, not
> a description of something already running.

---

## 1. What runs where

| Piece | What it is |
|---|---|
| App | Next.js 16 in `output: "standalone"` mode, one Node process under **pm2** |
| Web front | **nginx** — TLS, static files, `/uploads`, reverse proxy to Node |
| Database | **PostgreSQL** on the same VPS |
| Uploads | Local disk at `UPLOAD_DIR`, **outside** the repo and outside `public/` |
| Mail | Google Workspace SMTP |
| SMS | Optional gateway, unset by default (see §7) |

Everything is on one Lightsail VPS by choice (§9.1 of the plan): cheapest, and
the ops load is small at this scale. The cost is that a single machine failure is
a total outage — which is exactly why §5 (backups) matters more than it would
with a managed database.

---

## 2. First-time provisioning

```bash
# Postgres
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser --pwprompt bdaio
sudo -u postgres createdb --owner=bdaio bdaio_prod

# Node 22 + pm2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# nginx + certificates
sudo apt install -y nginx certbot python3-certbot-nginx
```

Then create `.env` on the server from `.env.example`. Required in production:
`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, the `SMTP_*` block, `EMAIL_FROM`,
`UPLOAD_DIR`, `SUBMISSION_DIR`, `CRON_SECRET`.

Generate `AUTH_SECRET` fresh on the server — never reuse the placeholder from
`.github/workflows/ci.yml`. A missing one throws on the first session signature
rather than falling back, so it fails loudly and early.

> **`APP_URL` is read at build time.** Canonical tags, `sitemap.xml`,
> `robots.txt`, and Open Graph images are all built from it. Changing it requires
> a rebuild, not just a restart.

> **`NEXT_PUBLIC_GA_ID` is also read at build time**, and is the only thing that
> turns Google Analytics on. Unset — which is the default, and what CI and
> development use — no `gtag.js` is served at all. It applies to public pages
> only; the signed-in tree is deliberately not measured (see
> `src/lib/analytics/record.ts`). Setting it after the build does nothing.

> **`CRON_SECRET` fails silently if you forget it.** The cron routes fail
> *closed*: with no secret configured they reject every caller, so the crontab
> in §5 gets a 401 and **the outgoing mail queue never drains and nightly
> housekeeping never runs**. Nothing errors in the app; mail simply stops going
> out once a request can no longer drain the queue itself. Confirm after the
> first deploy that `/var/log/bdaio-prune.log` is being written.

---

## 3. Deploying

```bash
cd /srv/bdaio
git pull
npm ci
npx prisma migrate deploy      # never `migrate dev` on a server
npm run build
pm2 restart bdaio
curl -fsS https://bdaio.org/api/health   # must return {"ok":true,...}
```

`standalone` builds do **not** copy static assets. After every build:

```bash
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

The `rm -rf` is not tidiness. `cp -r src dst` **copies into** `dst` when `dst`
already exists, so on the second deploy you get
`.next/standalone/.next/static/static/…` and the server keeps serving the
*previous* build's CSS and JS. The symptom is a site that renders unstyled after
a deploy that reported success. `npm run start:standalone` does this correctly.

Check the build output each time a database-backed page is added: a page that
only queries Prisma is marked `○ (Static)` and its data **freezes until the next
deploy** (§3.4). `ƒ Proxy` must appear — if it does not, route protection is
silently off (§3.5).

> **Known deviation — every public page is `ƒ (Dynamic)`.** The rule this
> paragraph used to state ("public list pages must show `revalidate`; `ƒ` only
> where a session is read") does not currently hold for any page, so do not read
> a build full of `ƒ` as a regression.
>
> The cause is `getCurrentUser()` in `src/app/(public)/layout.tsx`, which reads
> the session cookie so the header can show a signed-in state. A cookie read in
> a layout opts every route beneath it out of static rendering — the exact
> failure mode §13.2 of the plan warned about, arrived at through the session
> rather than the locale. It predates the `[locale]` flatten (it was in the old
> layout too, where it was already defeating that route's
> `generateStaticParams`), so nothing recent broke it.
>
> The consequence is capacity, not correctness: no page cache, so every visit to
> `/`, `/events`, `/faq` and the rest reaches Postgres. Survivable at ordinary
> traffic on one VPS; the thing to fix before a results-day or
> registration-deadline spike. The fix is to stop reading the session in the
> layout — render the header's signed-in state client-side, or split the layout —
> at which point restore the original rule above and this note goes away.

### pm2

```bash
pm2 start .next/standalone/server.js --name bdaio --env production
pm2 save && pm2 startup     # survive a reboot
pm2 logs bdaio --lines 100
```

---

## 4. nginx

Three things here are load-bearing for application behaviour, not just plumbing.

```nginx
server {
  listen 443 ssl http2;
  server_name bdaio.org;

  # 1. Rate limiting keys off the client IP, which Node can only learn from these
  #    headers. Without them every visitor looks like 127.0.0.1 and shares one
  #    budget — locking out real users while limiting nobody.
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
  }

  # 2. Uploads are served straight from disk, so image bytes never pass through
  #    Node. The trailing slashes matter.
  location /uploads/ {
    alias /srv/bdaio-uploads/;
    add_header X-Content-Type-Options nosniff;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
  }

  # 3. HSTS belongs here, on the server that owns the certificate — not in
  #    next.config.ts, where it would depend on a deploy.
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  client_max_body_size 4m;   # profile photos are capped at 1MB in the app
}
```

Everything else — `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
`nosniff`, and the no-cache rules for `/sw.js` — is set by the app in
`next.config.ts`, so it stays correct in development too.

---

## 5. Backups

**Postgres alone is not a backup of this app.** The database stores upload
*filenames*; without `UPLOAD_DIR` you restore a site where every profile photo
is a broken image (§3.6). `scripts/backup.sh` takes both.

```bash
sudo mkdir -p /var/backups/bdaio && sudo chown "$USER" /var/backups/bdaio
BACKUP_DIR=/var/backups/bdaio /srv/bdaio/scripts/backup.sh
```

Every dump is read back with `pg_restore --list` before the old ones rotate out,
and written under a `.partial` name until it passes — a half-written file must
never carry a name that looks like a good backup. The script exits non-zero on
failure, so cron will mail you.

### Cron

```cron
# Nightly backup at 02:30 Asia/Dhaka
30 2 * * * BACKUP_DIR=/var/backups/bdaio /srv/bdaio/scripts/backup.sh >> /var/log/bdaio-backup.log 2>&1

# Nightly housekeeping at 03:15 — expired sessions, used tokens, rate-limit
# rows, analytics past retention, delivered mail older than 90 days
15 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://bdaio.org/api/cron/prune >> /var/log/bdaio-prune.log 2>&1

# Outgoing mail queue, every minute. Most mail is already gone before this runs
# — the request that queued it drains the queue after responding — so this is
# the safety net: retry backoffs that expire while the site is idle, and jobs
# left behind by a process that died mid-send. Cheap when there is nothing to do
# and it only logs when it did something.
* * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://bdaio.org/api/cron/email > /dev/null 2>&1
```

Set `CRON_SECRET` in the crontab environment (or inline the token — the crontab
is root-readable only).

### Off-site copy

A backup on the same disk as the database survives a bad migration but not a lost
instance. Sync the directory somewhere else — object storage, another VPS,
anywhere with a different failure domain:

```cron
45 3 * * * rsync -az --delete /var/backups/bdaio/ backup-host:/backups/bdaio/
```

### Restore drill — do this before go-live, then quarterly

A backup nobody has restored is an assumption. Restore into a scratch database,
never production:

```bash
sudo -u postgres createdb bdaio_drill
RESTORE_DATABASE_URL="postgresql://bdaio:PASSWORD@localhost:5432/bdaio_drill" \
UPLOAD_DIR=/tmp/drill-uploads \
  /srv/bdaio/scripts/restore.sh \
  /var/backups/bdaio/db/bdaio-YYYYMMDD-HHMMSS.dump \
  /var/backups/bdaio/uploads/uploads-YYYYMMDD-HHMMSS.tar.gz
```

It asks you to type `RESTORE` and prints the target database first, because the
same command pointed one line higher is how a drill becomes an outage. Check row
counts and one restored file, then `dropdb bdaio_drill`.

---

## 6. Monitoring

`GET /api/health` returns `{"ok":true,"database":"up",…}` with **200**, or **503**
when Postgres is unreachable. It checks the database on purpose: a process that
is up but cannot reach its data should read as down, or a monitor stays green
through an outage. It exposes no versions, no error text, and no connection
details.

Point any uptime checker at it. `pm2 logs bdaio` has application logs;
`/var/log/nginx/` has access and error logs.

Traffic and Core Web Vitals are at **`/admin/analytics`**, measured first-party
(no Google Analytics, no cookies — see §3.12 of the plan).

---

## 7. SMS

Off unless `SMS_API_URL` and `SMS_API_KEY` are set; until then messages are
logged. Outside production, delivery is suppressed even when configured, because
seeded accounts carry invented numbers and a wrong SMS is a real message to a
stranger that we pay for.

No provider is committed to. `src/lib/sms/sender.ts` speaks the request shape
Bangladeshi gateways share (API key + recipient + sender id + text) with the
field names in `.env`, so most can be wired up by configuration. If one needs a
genuinely different request, add a branch to `buildRequest` — do not reshape the
callers.

Participants must also switch SMS on themselves, on `/dashboard/profile`.

---

## 8. Emergencies

**Roll back a deploy**

```bash
cd /srv/bdaio && git log --oneline -5
git checkout <previous-sha> && npm ci && npm run build && pm2 restart bdaio
```

Migrations do not roll back with the code. If the bad deploy included one,
restore the database from the last night's dump (§5) rather than improvising a
down-migration.

**Disable the service worker.** A bad worker can pin a broken app on returning
visitors' devices. Replace `public/sw.js` with just:

```js
self.addEventListener("install", () => self.registration.unregister());
```

Deploy that; the next visit unregisters it. `/sw.js` is served `no-store`
precisely so this takes effect immediately.

**Everyone is locked out of login.** Rate-limit rows are disposable:

```sql
DELETE FROM "RateLimit";
```

The limiter also fails open on a database error, so an outage cannot lock the
door on its own.

**Suspend an account immediately.** Suspending from `/admin/users` revokes every
session at once (§3.11) — access dies immediately, not at token expiry.

---

## 9. Not done yet

- The production VPS itself: Postgres, pm2, nginx, TLS, cron (§2–§5 above).
- Off-site backup destination.
- A staging subdomain (§9.7 of the plan).
- The restore drill has been rehearsed locally but never against production data.
