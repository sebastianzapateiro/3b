# VPS LasTresB (Hostinger)

**Producción desde el 1 nov 2026:** `https://www.lastresb.com.co` (canónico; `lastresb.com.co` y `vps.lastresb.com.co`
redirigen con 301). Ubuntu 26.04, 2 CPU, 8 GB, 96 GB, IP `2.24.110.171`. DNS en Cloudflare (DNS only).
Web y base en el VPS; los archivos (buckets `privado` y `publico`) siguen en **Supabase Storage**.

Copia de lo que vive en el servidor (sin secretos). Si cambias algo allá, tráelo acá.

| Repo | Servidor |
|---|---|
| `compose.yml` | `/opt/lastresb/compose.yml` (Postgres 17 + web) |
| `postgres-init/10-app.sh` | `/opt/lastresb/postgres-init/` (usuario `lastresb` sin superusuario, solo al crear el volumen) |
| `nginx/lastresb.conf` | `/etc/nginx/sites-available/lastresb` (www, redirecciones y modo mantenimiento) |
| `respaldo.sh`, `lastresb-respaldo.systemd` | `/opt/lastresb/respaldo.sh` y timer de systemd: `pg_dump` diario 3:00, 14 días en `/var/backups/lastresb` |
| `nginx/00-rechazo.conf` | Cierra peticiones a la IP o a otros dominios |

Solo en el servidor (permiso 600, nunca en git): `/opt/lastresb/.env` (claves de Postgres), `web.env` (variables de la app,
`DATABASE_URL` → `postgres:5432`) y `build.env` (igual, con `127.0.0.1:5432` para el build).

## Acceso

```bash
ssh lastresb        # usuario desarrollo
ssh lastresb-root   # root (solo llave)
```

`~/.ssh/config` usa la llave `vps_hosting` y **una sola conexión** (`ControlMaster`): ufw rechaza más de 6 conexiones
nuevas al puerto 22 en 30 s.

## Seguridad aplicada

- ufw: solo 22 (con límite), 80, 443. Postgres y la web escuchan solo en `127.0.0.1` (Docker se salta ufw en puertos publicados).
- SSH solo con llave, `MaxAuthTries 3`, fail2ban (1 h tras 5 fallos). nginx sin versión (`server_tokens off`).
- Certificado Let's Encrypt con renovación automática (`certbot.timer`).

## Mantenimiento

`ssh lastresb-root 'touch /var/www/mantenimiento/activo'` pone «Estamos de trasteo» (503) en www; `rm` del mismo archivo lo quita.
Debe estar en `/var/www`: nginx corre como `www-data` y no ve `/opt/lastresb` (750).

## Despliegue continuo (desde el 2 nov 2026)

Cada push a **`main`** despliega producción con GitHub Actions (`.github/workflows/desplegar.yml`): typecheck y pruebas,
luego `git archive` por SSH al usuario `despliegue`, cuya llave solo ejecuta `/opt/lastresb/desplegar.sh`. El script
construye la imagen en el servidor, verifica el dominio, activa, revisa `/api/v1/health` y `/`, y vuelve a la versión
anterior si no responde. Conserva las 5 últimas imágenes. `develop` no despliega nada.

- Publicar: merge de `develop` a `main` y push. Se ve en GitHub → Actions → «Desplegar producción».
- **Migraciones a mano, antes del merge** (`pnpm db:migrate` con el túnel). El despliegue no las aplica.
- Instalar o actualizar el script y la llave: `bash infra/vps/instalar-despliegue.sh <llave.pub>` (desde tu PC).
- Secretos del repo (Settings → Secrets and variables → Actions): `VPS_SSH_KEY` (llave privada), `VPS_KNOWN_HOSTS`
  (`ssh-keyscan -t ed25519 2.24.110.171`), `VPS_HOST` (`2.24.110.171`).
- Desplegar a mano el commit actual: `git archive HEAD | ssh lastresb-root /opt/lastresb/desplegar.sh $(git rev-parse HEAD)`.

## Desplegar una versión (a mano, como antes)

```bash
# Desde la raíz del repo, con el commit ya hecho:
git archive --format=tar HEAD | ssh lastresb-root 'rm -rf /opt/lastresb/src && mkdir -p /opt/lastresb/src && tar -x -C /opt/lastresb/src'
git rev-parse --short HEAD | ssh lastresb-root 'cat > /opt/lastresb/src/.version'
ssh lastresb-root 'cd /opt/lastresb/src && V=$(cat .version) && docker build --no-cache-filter build,app --network host -f apps/web/Dockerfile \
  --secret id=entorno,src=/opt/lastresb/build.env -t lastresb-web:$V -t lastresb-web:actual . \
  && cd .. && docker compose up -d web'
```

Volver a una versión anterior: `docker tag lastresb-web:<commit> lastresb-web:actual && docker compose up -d web`.

## Desarrollo local contra esta base

`ssh -fN lastresb-db` abre el túnel `127.0.0.1:5433 → Postgres del VPS` (alias en `~/.ssh/config`). Con él, `pnpm dev`,
`pnpm db:migrate` y `pnpm db:seed` usan **producción**. Cerrar: `pkill -f "ssh -fN lastresb-db"`.
Los `.env` locales con la URL de Supabase quedaron en `.env.supabase.bak` y `apps/web/.env.local.supabase.bak` (ignorados por git).

Antes de cambiar la imagen, verifica que tenga el dominio correcto:
`docker run --rm --entrypoint sh lastresb-web:<tag> -c 'grep -rl www.lastresb apps/web/.next/server | wc -l'` (> 0).

## Pendiente

- Respaldos fuera del VPS (hoy solo locales) y snapshots de Hostinger.
- `RESEND_API_KEY`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GA_ID`, `GOOGLE_SITE_VERIFICATION` si producción los usaba en Vercel.
- Quitar el dominio del proyecto en Vercel; dejar de usar la base de Supabase (conservarla un tiempo como respaldo).
- Usuario `desarrollo`: decidir sudo/grupo docker y cerrar la entrada de root.
