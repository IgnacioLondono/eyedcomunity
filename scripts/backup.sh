#!/bin/sh
set -eu

DATA_ROOT="${EYEDCOMUN_DATA_ROOT:-/srv/dev-disk-by-uuid-94f2a4b3-1a12-41f9-b0ee-e78aa049c7ea/SSD512/docker/eyedcomun}"
KIND="${1:-daily}"
case "$KIND" in daily|weekly|monthly) ;; *) echo "Uso: $0 [daily|weekly|monthly]" >&2; exit 2 ;; esac

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DESTINATION="$DATA_ROOT/app/backups/$KIND/$STAMP"
mkdir -p "$DESTINATION"
chmod 0750 "$DATA_ROOT/app/backups" "$DATA_ROOT/app/backups/$KIND" "$DESTINATION"

docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers eyedcomun' \
  > "$DESTINATION/mysql.sql"

tar -C "$DATA_ROOT" -czf "$DESTINATION/uploads.tar.gz" uploads
docker compose exec -T eyedcomun sh -c 'printf %s "$MEDIA_ENCRYPTION_KEY"' > "$DESTINATION/media_encryption_key"
chmod 0600 "$DESTINATION/mysql.sql" "$DESTINATION/uploads.tar.gz" "$DESTINATION/media_encryption_key"
(cd "$DESTINATION" && sha256sum mysql.sql uploads.tar.gz media_encryption_key > SHA256SUMS)

case "$KIND" in
  daily) KEEP=7 ;;
  weekly) KEEP=4 ;;
  monthly) KEEP=12 ;;
esac
ls -1dt "$DATA_ROOT/app/backups/$KIND"/* 2>/dev/null | awk "NR>$KEEP" | xargs -r rm -rf

echo "Backup completo: $DESTINATION"
