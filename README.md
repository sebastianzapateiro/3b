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

Empieza por [docs/README.md](docs/README.md). Las reglas para agentes de IA están en [CLAUDE.md](CLAUDE.md).

## Estado

Fase 1: esqueleto listo (home, portafolio y backoffice de prueba, auth configurada, esquema completo con migración inicial). Siguiente: búsqueda (P2), portafolio real (P7) y alta de proveedor (P3).
