# Las 3B

**Bueno, bonito y barato en Bogotá.** Directorio de servicios y oficios por localidad, con contacto directo por WhatsApp. Sitio: lastresb.com.co

## Empezar

Requisitos: Node 22 y pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env
cp .env.example apps/web/.env.local
# completa DATABASE_URL (Supabase) y BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Abre http://localhost:3000.

## Estructura

```
apps/web          Next.js: sitio público (PWA), /admin, /api/v1, /api/auth
apps/mobile       App Expo (fase 2)
packages/db       Esquema Drizzle, migraciones y semillas
packages/shared   Marca, localidades, slug, WhatsApp
packages/config   tsconfig base
docs/             Resumen de visión, requerimientos, casos de uso, arquitectura, legal y marca
```

## Documentación

Empieza por [docs/README.md](docs/README.md). El plan de trabajo está en [docs/06-plan.md](docs/06-plan.md).

## Trabajar con agentes de IA

- [AGENTS.md](AGENTS.md): reglas, stack, estado y flujo de trabajo. Lo leen opencode, Codex, Cursor y Claude Code (`CLAUDE.md` lo importa).
- [docs/06-plan.md](docs/06-plan.md): backlog ordenado con criterios de aceptación. Pide al agente "sigue con la siguiente tarea del plan".
- `opencode.json` carga el plan en cada sesión de opencode.

## Estado

Fase 1: home, SEO, cuenta (ingreso, registro, recuperación) y esquema completo en Supabase. Siguiente: búsqueda (P2), portafolio con diseño (P7), contacto (P4) y alta de proveedor (P3). Detalle en [AGENTS.md](AGENTS.md#estado).
