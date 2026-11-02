#!/bin/bash
# LasTresB · respaldo diario de Postgres (formato custom de pg_dump). Conserva DIAS días.
set -euo pipefail
DESTINO=/var/backups/lastresb
DIAS=14
ARCHIVO="$DESTINO/lastresb-$(date +%Y%m%d-%H%M).dump"
umask 077
cd /opt/lastresb
docker compose exec -T postgres pg_dump -U postgres -d lastresb -Fc > "$ARCHIVO.tmp"
# Comprobar que el respaldo se puede leer antes de darlo por bueno
docker compose exec -T postgres pg_restore -l < "$ARCHIVO.tmp" > /dev/null
mv "$ARCHIVO.tmp" "$ARCHIVO"
find "$DESTINO" -name "lastresb-*.dump" -mtime +$DIAS -delete
echo "respaldo ok: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
