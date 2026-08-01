#!/usr/bin/env bash
#
# Nightly backup: PostgreSQL + the uploads directory.
#
#   ./scripts/backup.sh
#
# Reads DATABASE_URL and UPLOAD_DIR from the app's .env (or the environment).
# Writes to $BACKUP_DIR (default /var/backups/bdaio) and logs to backup.log
# there. Cron wiring and restore drills are in docs/OPS.md.
#
# Two decisions worth knowing:
#
#  1. **Uploads are backed up with the database, not separately.** The database
#     only stores *filenames* — a Postgres-only backup restores a site whose
#     every profile photo is a broken image (§3.6).
#
#  2. **Every dump is verified before the old ones are rotated out.** pg_dump
#     exits 0 on plenty of dumps that will not restore, so the archive's table of
#     contents is read back with `pg_restore --list`. A backup nobody has ever
#     read is a hope, not a backup.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bdaio}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DAY_OF_MONTH="$(date +%d)"

# --- Load configuration ----------------------------------------------------
# shellcheck source=scripts/_env.sh
. "$ROOT/scripts/_env.sh"

DATABASE_URL="${DATABASE_URL:-$(env_value DATABASE_URL)}"
UPLOAD_DIR="$(resolve_upload_dir "${UPLOAD_DIR:-$(env_value UPLOAD_DIR)}")"

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set and was not found in $ROOT/.env" >&2
  exit 1
fi

PG_URL="$(strip_prisma_params "$DATABASE_URL")"
PG_SCHEMA="$(prisma_schema "$DATABASE_URL")"

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"
LOG="$BACKUP_DIR/backup.log"

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG"; }
fail() { log "FAILED: $*"; exit 1; }

log "=== backup started ($(safe_url "$PG_URL")) ==="

# --- Database ---------------------------------------------------------------
DB_FILE="$BACKUP_DIR/db/bdaio-$STAMP.dump"

# Everything is written to a .partial name and only renamed once it has been
# verified. A half-written dump must never carry a filename that looks like a
# good backup — that is the file someone reaches for in an emergency.
cleanup_partials() { rm -f "$BACKUP_DIR"/db/*.partial "$BACKUP_DIR"/uploads/*.partial; }
trap cleanup_partials EXIT

# Custom format (-Fc): compressed, and restorable table-by-table, which is what
# you want at 2am when one table is corrupt and the rest is fine.
#
# Only a non-default schema is passed through; dumping `--schema=public`
# explicitly would leave out anything installed outside it.
if [ -n "$PG_SCHEMA" ] && [ "$PG_SCHEMA" != "public" ]; then
  pg_dump --format=custom --no-owner --no-privileges --schema="$PG_SCHEMA" \
    --file="$DB_FILE.partial" "$PG_URL" || fail "pg_dump exited non-zero"
else
  pg_dump --format=custom --no-owner --no-privileges \
    --file="$DB_FILE.partial" "$PG_URL" || fail "pg_dump exited non-zero"
fi

[ -s "$DB_FILE.partial" ] || fail "dump file is empty"

# The verification step: can this archive actually be read back?
if ! pg_restore --list "$DB_FILE.partial" > /dev/null 2>&1; then
  fail "dump is unreadable by pg_restore"
fi

TABLES="$(pg_restore --list "$DB_FILE.partial" | grep -c 'TABLE DATA' || true)"
[ "$TABLES" -gt 0 ] || fail "dump contains no table data"

mv "$DB_FILE.partial" "$DB_FILE"
log "database ok: $(du -h "$DB_FILE" | cut -f1), $TABLES tables"

# --- Uploads ----------------------------------------------------------------
if [ -d "$UPLOAD_DIR" ]; then
  UP_FILE="$BACKUP_DIR/uploads/uploads-$STAMP.tar.gz"
  tar -czf "$UP_FILE.partial" -C "$UPLOAD_DIR" . || fail "tar of $UPLOAD_DIR failed"
  tar -tzf "$UP_FILE.partial" > /dev/null 2>&1 || fail "uploads archive is unreadable"
  mv "$UP_FILE.partial" "$UP_FILE"
  log "uploads ok: $(du -h "$UP_FILE" | cut -f1) from $UPLOAD_DIR"
else
  log "WARNING: upload directory not found at $UPLOAD_DIR — skipping"
fi

# --- Checksums --------------------------------------------------------------
# So a silently-corrupted file can be told apart from a bad restore later.
(cd "$BACKUP_DIR" && sha256sum "db/bdaio-$STAMP.dump" >> checksums.txt) || true
[ -n "${UP_FILE:-}" ] && (cd "$BACKUP_DIR" && sha256sum "uploads/uploads-$STAMP.tar.gz" >> checksums.txt) || true

# --- Rotation ---------------------------------------------------------------
# Keep KEEP_DAYS of dailies, and the 1st of each month forever: a corruption
# noticed in March should still be recoverable from January.
prune() {
  local dir="$1" pattern="$2"
  find "$dir" -name "$pattern" -type f -mtime "+$KEEP_DAYS" | while read -r file; do
    case "$(basename "$file")" in
      # …-YYYYMM01-HHMMSS.* — the 1st of a month is kept indefinitely.
      *-??????01-??????.*) log "keeping monthly $(basename "$file")" ;;
      *) rm -f "$file" && log "pruned $(basename "$file")" ;;
    esac
  done
}

prune "$BACKUP_DIR/db" 'bdaio-*.dump'
prune "$BACKUP_DIR/uploads" 'uploads-*.tar.gz'

log "=== backup finished (day $DAY_OF_MONTH, keeping ${KEEP_DAYS}d + monthlies) ==="
