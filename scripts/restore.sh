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
CURRENT_MEDIA_KEY="$(docker compose exec -T eyedcomun sh -c 'printf %s "$MEDIA_ENCRYPTION_KEY"' 2>/dev/null || true)"
BACKUP_MEDIA_KEY="$(cat "$BACKUP/media_encryption_key")"
if [ -z "$CURRENT_MEDIA_KEY" ] || [ "$CURRENT_MEDIA_KEY" != "$BACKUP_MEDIA_KEY" ]; then
  echo "MEDIA_ENCRYPTION_KEY de Portainer no coincide con la copia; corrígela antes de restaurar." >&2
  exit 1
fi
docker compose stop eyedcomun

if [ -d "$DATA_ROOT/uploads" ]; then
  mv "$DATA_ROOT/uploads" "$DATA_ROOT/uploads.before-$STAMP"
fi
tar -C "$DATA_ROOT" -xzf "$BACKUP/uploads.tar.gz"

docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot eyedcomun' \
  < "$BACKUP/mysql.sql"

docker compose start eyedcomun
echo "Restauración completada. Conserva uploads.before-$STAMP hasta validar la aplicación."
