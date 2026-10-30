# LasTresB

**Bueno, bonito y barato en Bogotá.** Directorio de servicios y oficios por localidad, con contacto directo por WhatsApp. Sitio: lastresb.com.co

## Empezar

Requisitos: Node 22 y pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env
cp .env.example apps/web/.env.local   # mismo contenido en los dos
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre http://localhost:3000.

### Variables de entorno

Van en `.env` (raíz: comandos de base de datos) **y** en `apps/web/.env.local` (Next.js), con el mismo contenido. Plantilla en `.env.example`. Nunca las subas a git.

| Variable | Para qué | Cómo obtenerla |
|---|---|---|
| `DATABASE_URL` | Postgres de Supabase | Session pooler, puerto 5432 (en Vercel: Transaction pooler, 6543). Clave codificada en la URL |
| `BETTER_AUTH_SECRET` | Firma de cookies de sesión y 2FA | `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | URL base | `http://localhost:3000` en local |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storage (buckets `privado` y `publico`) | Supabase → Project Settings → API. La service role key solo va en el servidor |
| `DOCUMENTOS_CLAVE` | Cifrado AES-256-GCM del documento del proveedor | `openssl rand -base64 32`. **Si se pierde, los documentos no se recuperan**: guárdala en un gestor de claves |
| `RESEND_API_KEY` | Envío de correos | Opcional en local: sin ella los enlaces salen en la consola de `pnpm dev` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Ingreso con Google | Opcional: sin ellas el botón no aparece |

## Comandos

Todos se corren desde la raíz del repositorio.

> ⚠️ **Los comandos de base de datos actúan sobre `DATABASE_URL`, que hoy es la misma base de producción** (local y Vercel comparten Supabase). Revisa antes de correr `db:migrate`, `db:seed`, `admin:crear` o `db:cifrar-documentos --aplicar`.

### Desarrollo

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta la web en http://localhost:3000. Sin `RESEND_API_KEY`, los correos (verificación, recuperación, invitaciones) salen en esta consola. |
| `pnpm typecheck` | Revisa los tipos de TypeScript en todo el monorepo. |
| `pnpm build` | Compila para producción. Usa `pnpm build --force` si cambiaste variables de entorno (Turborepo guarda el build en caché). |

### Base de datos

| Comando | Qué hace | Cuándo |
|---|---|---|
| `pnpm db:generate` | Crea una migración SQL en `packages/db/drizzle/` a partir de los cambios en `packages/db/src/schema/*`. | Después de cambiar el esquema. Revisa el SQL generado antes de aplicarlo. |
| `pnpm db:migrate` | Aplica las migraciones pendientes. Los avisos `NOTICE … already exists, skipping` son normales. | Tras `db:generate` o al traer migraciones de otra rama. |
| `pnpm db:seed` | Carga localidades, insignias, taxonomía con sinónimos y festivos. Se puede correr varias veces. | Base nueva o tras cambiar la taxonomía. |
| `pnpm db:studio` | Abre Drizzle Studio para ver y editar tablas en el navegador. | Consultas puntuales. Cuidado: edita producción. |
| `pnpm db:cifrar-documentos` | Cuenta los documentos de proveedores guardados en texto plano. Con `pnpm db:cifrar-documentos --aplicar` los cifra (AES-256-GCM). | Si aparecen documentos sin cifrar. Necesita `DOCUMENTOS_CLAVE`. |

### Cuentas del equipo

| Comando | Qué hace |
|---|---|
| `pnpm usuarios` | Lista las cuentas creadas: correo, nombre, roles, correo verificado, 2FA, forma de ingreso, estado de proveedor, suspensión y fecha (hora de Bogotá). Solo lectura. |
| `pnpm usuarios admin` | Filtra por rol (`comprador`, `proveedor`, `verificador`, `moderador`, `admin`). Con otro texto filtra por correo o nombre: `pnpm usuarios gmail.com`. |
| `pnpm admin:crear <correo>` | Da rol **admin** a una cuenta que ya existe, marca su correo como verificado y lo registra en `auditoria`. No crea la cuenta ni cambia la clave. |

**Primer administrador** (o recuperar el acceso si no queda ningún admin):

1. Crea la cuenta en `/ingreso` (en local http://localhost:3000/ingreso, en producción https://www.lastresb.com.co/ingreso). La clave la eliges tú.
2. Desde tu terminal: `pnpm admin:crear tu-correo@ejemplo.com`
3. Entra por `/admin/ingresar` y escanea el QR del 2FA con tu app autenticadora (Google Authenticator, Authy, 1Password…). Guarda los códigos de respaldo.

El resto del equipo se invita desde **/admin/usuarios → Crear usuario**: reciben un correo para elegir su clave. Ahí mismo se asignan roles, se suspenden cuentas, se restablece el 2FA y se decide qué roles lo exigen (admin siempre).

### Documentación

| Comando | Qué hace |
|---|---|
| `pnpm docs:diagramas` | Regenera los SVG de `docs/diagramas/` desde `docs/07-diagramas.md`. Usa el Chrome instalado; otra ruta: `CHROME=/ruta/al/chrome pnpm docs:diagramas`. |

## Estructura

```
apps/web          Next.js 16: sitio público (PWA), /panel del proveedor, /admin, /api/v1, /api/auth
apps/mobile       App Expo (fase 2, aún no creada)
packages/db       Esquema Drizzle, migraciones, semillas, cifrado y scripts
packages/shared   Marca, localidades, categorías, slug, WhatsApp, parámetros, días hábiles
packages/config   tsconfig base
docs/             Visión, requerimientos, casos de uso, arquitectura, legal, marca, plan y mockups
```

## Documentación

Empieza por [docs/README.md](docs/README.md). El plan de trabajo está en [docs/06-plan.md](docs/06-plan.md) y los diagramas de arquitectura en [docs/07-diagramas.md](docs/07-diagramas.md) (Mermaid: GitHub y VS Code los dibujan).

## Trabajar con agentes de IA

- [AGENTS.md](AGENTS.md): reglas, stack, estado y flujo de trabajo. Lo leen opencode, Codex, Cursor y Claude Code (`CLAUDE.md` lo importa).
- [docs/06-plan.md](docs/06-plan.md): backlog con criterios de aceptación. Pide al agente "sigue con la siguiente tarea del plan".
- `opencode.json` carga el plan en cada sesión de opencode.

## Estado (29 oct 2026)

Construido: búsqueda, portafolio, contacto por WhatsApp, cuentas, alta de proveedor en 3 pasos, panel del proveedor, reseñas, páginas legales y reclamos, SEO por oficio y localidad, y backoffice completo (B1–B8) con 2FA. Pendiente para lanzar: subida de archivos al bucket privado, OTP real por WhatsApp, `GET /api/v1/proveedores` y la sesión de 8 h del backoffice. Detalle en [AGENTS.md](AGENTS.md#estado) y [docs/06-plan.md](docs/06-plan.md).
