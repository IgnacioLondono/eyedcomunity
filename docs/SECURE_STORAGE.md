# Almacenamiento seguro de EyedComun

## Preparar Portainer

La raíz recomendada es:

`/srv/dev-disk-by-uuid-94f2a4b3-1a12-41f9-b0ee-e78aa049c7ea/SSD512/docker/eyedcomun`

Crea `mysql`, `uploads`, `app/backups` y `secrets`. Los directorios de la aplicación deben pertenecer a UID/GID `1001:1001` y usar permisos `0750`. Antes de cambiar el propietario de `mysql`, comprueba el UID usado por la imagen `mysql:8.4`; no uses `chmod 777`.

Dentro de `secrets` crea archivos sin salto de línea y con permisos `0600`:

- `auth_secret`: `openssl rand -base64 48`
- `discord_secret`: secreto OAuth de Discord
- `community_api_key`: la misma clave configurada en EyedBot
- `mysql_password`: contraseña larga para el usuario de la aplicación
- `mysql_root_password`: contraseña root distinta
- `media_encryption_key`: `openssl rand -base64 32`

La clave `media_encryption_key` es irreemplazable: sin ella no se pueden recuperar las imágenes. Guárdala también fuera del SSD y nunca la añadas a Git.

En el Stack de Portainer configura `AUTH_DISCORD_ID`, `AUTH_URL`, `DISCORD_GUILD_ID`, `EYEDBOT_API_URL`, `EYEDCOMUN_DATA_ROOT` y, si hace falta, `EYEDCOMUN_PORT`. El puerto 3306 no se publica. Al arrancar, EyedComun espera a MySQL, carga los secretos mediante `_FILE`, ejecuta las migraciones y falla si alguna no puede aplicarse.

## Operación

- `/api/health` confirma que el proceso responde.
- `/api/ready` comprueba migraciones, MySQL y escritura atómica en el volumen.
- Cada usuario dispone de 100 MB. La reserva se hace con una actualización condicional dentro de una transacción para impedir que cargas concurrentes superen la cuota.
- Los originales nunca se guardan. Sharp valida el raster, elimina metadatos, corrige orientación y crea WebP; después AES-256-GCM cifra el resultado con nonce aleatorio y AAD.
- Avatar y banner son visibles únicamente para miembros actuales. Los adjuntos de EyedCircle exigen pertenecer al círculo.
- La membresía se vuelve a consultar a EyedBot con una caché máxima de dos minutos.

## Copias y restauración

Ejecuta `scripts/backup.sh daily`, `weekly` o `monthly` desde la carpeta del stack. El script conserva 7 diarias, 4 semanales y 12 mensuales. Cada copia contiene el volcado consistente de MySQL, los objetos cifrados, sumas SHA-256 y la clave de medios.

Conserva al menos una copia cifrada fuera de este SSD. Para restaurar:

`RESTORE_CONFIRM=YES scripts/restore.sh /ruta/al/backup`

La restauración verifica sumas, detiene la web, conserva el volumen anterior, restaura archivos, clave y base de datos, y vuelve a iniciar el servicio. Valida `/api/ready` antes de borrar `uploads.before-*`.

## Rotación y respuesta a incidentes

`MEDIA_ENCRYPTION_KEY_VERSION` identifica la clave usada. La versión actual solo admite lectura con la clave montada; por ello una rotación requiere un proceso explícito de recifrado antes de retirar la clave anterior. Si se pierde o filtra una clave, detén las cargas, conserva una copia consistente y recifra los objetos con una clave nueva.
