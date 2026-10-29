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

### Primer administrador

```bash
# 1. Crea tu cuenta en http://localhost:3000/registro (tú eliges la clave)
pnpm admin:crear tu-correo@ejemplo.com
# 2. Entra a http://localhost:3000/admin/ingresar y escanea el QR del 2FA
```

El resto del equipo se invita desde **/admin/usuarios → Crear usuario** (reciben un enlace para elegir su clave).

## Comandos

```bash
pnpm dev                    # web en http://localhost:3000
pnpm typecheck
pnpm build
pnpm db:generate            # nueva migración tras cambiar packages/db/src/schema/*
pnpm db:migrate             # aplica migraciones a DATABASE_URL
pnpm db:seed                # localidades, insignias, taxonomía (idempotente)
pnpm db:studio
pnpm admin:crear <correo>   # da rol admin a una cuenta existente
pnpm db:cifrar-documentos   # revisa documentos en texto plano; --aplicar los cifra
pnpm docs:diagramas         # regenera los SVG de docs/diagramas/ desde docs/07-diagramas.md
```

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
