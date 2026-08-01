# Shared helpers for scripts/backup.sh and scripts/restore.sh.
# Sourced, not executed. Expects $ROOT to be the app root.

# Reads a single key out of the app's .env.
#
# Deliberately not `source .env`: that would execute whatever is in the file, and
# .env holds secrets edited by hand on a server.
env_value() {
  local key="$1"
  [ -f "$ROOT/.env" ] || return 0
  sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "$ROOT/.env" \
    | tail -1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

# Prisma's connection URL carries parameters libpq rejects outright — a plain
# `?schema=public` makes pg_dump exit with "invalid URI query parameter". This
# rebuilds the query string with only the parameters libpq understands, rather
# than deleting them with a regex (which breaks the `?` when the first parameter
# is the one removed).
strip_prisma_params() {
  local url="$1" base query kept="" pair
  base="${url%%\?*}"
  if [ "$base" = "$url" ]; then
    printf '%s' "$url"
    return
  fi
  query="${url#*\?}"
  local IFS='&'
  for pair in $query; do
    case "${pair%%=*}" in
      schema | connection_limit | pool_timeout | pgbouncer | socket_timeout | \
        statement_cache_size | sslidentity | sslpassword) ;;
      *) kept="${kept:+$kept&}$pair" ;;
    esac
  done
  printf '%s%s' "$base" "${kept:+?$kept}"
}

# The non-default Postgres schema, if the app is configured to use one.
prisma_schema() {
  printf '%s' "$1" | sed -n 's/.*[?&]schema=\([^&]*\).*/\1/p'
}

# Resolves UPLOAD_DIR, which defaults to the relative ./uploads.
resolve_upload_dir() {
  local dir="${1:-$ROOT/uploads}"
  case "$dir" in
    /*) printf '%s' "$dir" ;;
    *) printf '%s' "$ROOT/${dir#./}" ;;
  esac
}

# Hides the password in a connection string before it is printed or logged.
safe_url() {
  printf '%s' "$1" | sed -E 's#(://[^:/]+):[^@]*@#\1:***@#'
}
