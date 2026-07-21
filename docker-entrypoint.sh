#!/bin/sh
set -eu

load_secret() {
  variable="$1"
  file_variable="${variable}_FILE"
  eval "file_path=\${$file_variable:-}"
  if [ -n "$file_path" ]; then
    if [ ! -r "$file_path" ]; then
      echo "No se puede leer el secreto $file_variable" >&2
      exit 1
    fi
    value="$(cat "$file_path")"
    export "$variable=$value"
    unset "$file_variable"
  fi
}

load_secret AUTH_SECRET
load_secret AUTH_DISCORD_SECRET
load_secret COMMUNITY_API_KEY
load_secret DB_PASSWORD
load_secret MEDIA_ENCRYPTION_KEY

mkdir -p "${MEDIA_STORAGE_PATH:-/app/uploads}/tmp" "${MEDIA_STORAGE_PATH:-/app/uploads}/objects"

exec "$@"
