#!/bin/sh
set -eu

if [ "${RESTORE_CONFIRM:-}" != "YES" ] || [ "$#" -ne 1 ]; then
  echo "Uso: RESTORE_CONFIRM=YES $0 /ruta/al/backup" >&2
  exit 2
fi

BACKUP="$(cd "$1" && pwd)"
DATA_ROOT="${EYEDCOMUN_DATA_ROOT:-/srv/dev-disk-by-uuid-94f2a4b3-1a12-41f9-b0ee-e78aa049c7ea/SSD512/docker/eyedcomun}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

(cd "$BACKUP" && sha256sum -c SHA256SUMS)
docker compose stop eyedcomun

if [ -d "$DATA_ROOT/uploads" ]; then
  mv "$DATA_ROOT/uploads" "$DATA_ROOT/uploads.before-$STAMP"
fi
tar -C "$DATA_ROOT" -xzf "$BACKUP/uploads.tar.gz"
cp "$BACKUP/media_encryption_key" "$DATA_ROOT/secrets/media_encryption_key"
chmod 0600 "$DATA_ROOT/secrets/media_encryption_key"

docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$(cat /run/secrets/mysql_root_password)" mysql -uroot eyedcomun' \
  < "$BACKUP/mysql.sql"

docker compose start eyedcomun
echo "Restauración completada. Conserva uploads.before-$STAMP hasta validar la aplicación."
