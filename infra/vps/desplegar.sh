#!/usr/bin/env bash
# Despliegue de LasTresB en el VPS. Vive en /opt/lastresb/desplegar.sh (root, 700).
#
# Lo llama GitHub Actions al hacer push a `main`, con una llave SSH que SOLO puede ejecutar este script
# (command="..." en /root/.ssh/authorized_keys): el código llega como tar por la entrada estándar y el commit
# en SSH_ORIGINAL_COMMAND. A mano: git archive HEAD | ssh lastresb-root /opt/lastresb/desplegar.sh <commit>
#
# Construye la imagen, verifica el dominio, la activa y revisa que responda. Si algo falla, vuelve a la versión
# anterior. No aplica migraciones: van a mano antes de desplegar (decisión del dueño, 2 nov 2026).
set -euo pipefail

BASE=/opt/lastresb
cd "$BASE"

# Un despliegue a la vez.
exec 9>"$BASE/.desplegar.lock"
flock -n 9 || { echo "Ya hay un despliegue en curso." >&2; exit 1; }

COMMIT="${SSH_ORIGINAL_COMMAND:-${1:-}}"
[[ "$COMMIT" =~ ^[0-9a-f]{7,40}$ ]] || { echo "Falta el commit (7 a 40 caracteres hexadecimales)." >&2; exit 1; }
V="${COMMIT:0:7}"
echo "==> Desplegando $V"

# 1. Código: se recibe en una carpeta nueva y solo reemplaza a src si llegó completo.
rm -rf src.nuevo && mkdir src.nuevo
tar -x -C src.nuevo
[[ -f src.nuevo/apps/web/Dockerfile ]] || { echo "El código recibido está incompleto." >&2; exit 1; }
echo "$V" > src.nuevo/.version
rm -rf src && mv src.nuevo src

# 2. Imagen. Sin caché en las etapas que leen variables: BuildKit reusaba valores viejos.
docker build --no-cache-filter build,app --network host -f src/apps/web/Dockerfile \
  --secret id=entorno,src="$BASE/build.env" -t "lastresb-web:$V" src

# 3. La imagen debe traer el dominio de producción.
N=$(docker run --rm --entrypoint sh "lastresb-web:$V" -c 'grep -rl www.lastresb apps/web/.next/server | wc -l')
[[ "$N" -gt 0 ]] || { echo "La imagen no trae www.lastresb.com.co: no se activa." >&2; exit 1; }

# 4. Activar, guardando la anterior para volver si falla.
ANTERIOR=$(docker image inspect lastresb-web:actual --format '{{.Id}}' 2>/dev/null || true)
docker tag "lastresb-web:$V" lastresb-web:actual
docker compose up -d web

responde() {
  curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:3000/api/v1/health &&
    [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3000/)" == "200" ]]
}
for _ in $(seq 1 30); do
  if responde; then
    echo "==> $V en producción"
    # Limpieza: conserva las 5 versiones más recientes de la web (para volver a mano) e imágenes sin etiqueta.
    docker image ls lastresb-web --format '{{.Tag}}' | grep -v '^actual$' | tail -n +6 | xargs -r -I{} docker rmi "lastresb-web:{}" >/dev/null 2>&1 || true
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "La versión $V no respondió: vuelvo a la anterior." >&2
if [[ -n "$ANTERIOR" ]]; then
  docker tag "$ANTERIOR" lastresb-web:actual
  docker compose up -d web
fi
exit 1
