#!/usr/bin/env bash
#
# Restore from a backup produced by scripts/backup.sh.
#
#   ./scripts/restore.sh /var/backups/bdaio/db/bdaio-20260801-0230.dump \
#                        [/var/backups/bdaio/uploads/uploads-20260801-0230.tar.gz]
#
# This exists so that restoring is a rehearsed, single command rather than
# something improvised during an outage. Run it against a scratch database every
# few months — see the drill in docs/OPS.md. A backup nobody has restored is
# still an assumption.
#
# It is destructive: it drops and recreates every object in the target database.
# So it refuses to run without an explicit typed confirmation, and prints exactly
# which database it is about to overwrite first.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DUMP="${1:-}"
UPLOADS_ARCHIVE="${2:-}"

if [ -z "$DUMP" ]; then
  echo "usage: $0 <database.dump> [uploads.tar.gz]" >&2
  exit 64
fi
[ -f "$DUMP" ] || { echo "FATAL: no such dump: $DUMP" >&2; exit 1; }

# shellcheck source=scripts/_env.sh
. "$ROOT/scripts/_env.sh"

# RESTORE_DATABASE_URL is separate from DATABASE_URL on purpose: it takes a
# deliberate act to point this script at production.
TARGET="${RESTORE_DATABASE_URL:-${DATABASE_URL:-$(env_value DATABASE_URL)}}"
[ -n "$TARGET" ] || { echo "FATAL: no target database URL" >&2; exit 1; }
TARGET="$(strip_prisma_params "$TARGET")"

UPLOAD_DIR="$(resolve_upload_dir "${UPLOAD_DIR:-$(env_value UPLOAD_DIR)}")"

# Show the host and database name, never the password.
SAFE_TARGET="$(safe_url "$TARGET")"

echo
echo "  Restore source : $DUMP"
[ -n "$UPLOADS_ARCHIVE" ] && echo "  Uploads source : $UPLOADS_ARCHIVE"
echo "  Target database: $SAFE_TARGET"
[ -n "$UPLOADS_ARCHIVE" ] && echo "  Uploads target : $UPLOAD_DIR"
echo
echo "  This ERASES the target database's current contents."
echo
printf '  Type RESTORE to continue: '
read -r CONFIRM
[ "$CONFIRM" = "RESTORE" ] || { echo "Aborted."; exit 1; }

echo "==> verifying archive"
pg_restore --list "$DUMP" > /dev/null || { echo "FATAL: dump is unreadable" >&2; exit 1; }

echo "==> restoring database"
# --clean --if-exists drops existing objects first; without it a restore onto a
# live schema half-succeeds and leaves a mess that looks like a working site.
# --single-transaction means a failure rolls back to the pre-restore state.
pg_restore \
  --clean --if-exists \
  --no-owner --no-privileges \
  --single-transaction \
  --dbname="$TARGET" \
  "$DUMP"

if [ -n "$UPLOADS_ARCHIVE" ]; then
  [ -f "$UPLOADS_ARCHIVE" ] || { echo "FATAL: no such archive: $UPLOADS_ARCHIVE" >&2; exit 1; }
  echo "==> restoring uploads into $UPLOAD_DIR"
  mkdir -p "$UPLOAD_DIR"
  tar -xzf "$UPLOADS_ARCHIVE" -C "$UPLOAD_DIR"
fi

echo
echo "Done. Restart the app (pm2 restart bdaio) and check /api/health."
echo "Then spot-check a profile photo — that is what proves the uploads half worked."
