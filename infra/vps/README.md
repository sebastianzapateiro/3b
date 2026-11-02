# VPS LasTresB (Hostinger)

Servidor de prueba: `https://vps.lastresb.com.co` (Ubuntu 26.04, 2 CPU, 8 GB, 96 GB). Producción sigue en Vercel + Supabase
hasta el cambio de dominio. Archivos privados y públicos siguen en **Supabase Storage**.

Copia de lo que vive en el servidor (sin secretos). Si cambias algo allá, tráelo acá.

| Repo | Servidor |
|---|---|
| `compose.yml` | `/opt/lastresb/compose.yml` (Postgres 17 + web) |
| `postgres-init/10-app.sh` | `/opt/lastresb/postgres-init/` (usuario `lastresb` sin superusuario, solo al crear el volumen) |
| `nginx/lastresb.conf` | `/etc/nginx/sites-available/lastresb` (certbot agregó el bloque 443) |
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

## Desplegar una versión

```bash
# Desde la raíz del repo, con el commit ya hecho:
git archive --format=tar HEAD | ssh lastresb-root 'rm -rf /opt/lastresb/src && mkdir -p /opt/lastresb/src && tar -x -C /opt/lastresb/src'
git rev-parse --short HEAD | ssh lastresb-root 'cat > /opt/lastresb/src/.version'
ssh lastresb-root 'cd /opt/lastresb/src && V=$(cat .version) && docker build --network host -f apps/web/Dockerfile \
  --secret id=entorno,src=/opt/lastresb/build.env -t lastresb-web:$V -t lastresb-web:actual . \
  && cd .. && docker compose up -d web'
```

Volver a una versión anterior: `docker tag lastresb-web:<commit> lastresb-web:actual && docker compose up -d web`.

Migraciones: `DATABASE_URL` apuntando al VPS por túnel (`ssh -L 5433:127.0.0.1:5432 lastresb-root`) y `pnpm db:migrate`.

## Pendiente

- Respaldos diarios de Postgres (`pg_dump`) y snapshots del VPS.
- `RESEND_API_KEY` (hoy los correos salen en `docker compose logs web`).
- Google OAuth: agregar `https://vps.lastresb.com.co/api/auth/callback/google` en Google Cloud.
- Cambio final: copia final de datos desde Supabase, `lastresb.com.co` al VPS, `SITIO_INDEXABLE=true`.
- Usuario `desarrollo`: decidir sudo/grupo docker y cerrar la entrada de root.
