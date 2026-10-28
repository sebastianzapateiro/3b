# Las 3B — guía para agentes de IA

Este archivo lo leen Claude Code, opencode, Codex, Cursor y cualquier agente compatible con `AGENTS.md`. Es la única fuente de instrucciones para agentes: `CLAUDE.md` solo lo importa.

Directorio de servicios y oficios en Bogotá: el comprador busca por servicio y localidad y contacta al proveedor directo por WhatsApp. Gratis, sin comisiones. Las 3B es un **portal de contacto**, no intermediario de pagos ni garante del servicio.

Dueño: Sebastián Zapateiro. Responde en español, conciso. Analiza y muestra hallazgos antes de cambios grandes; confirma alcance antes de entregas largas.

## Cómo trabajar en este repo

1. **Lee en este orden** antes de tocar código:
   - Este archivo (reglas y estado).
   - [`docs/06-plan.md`](docs/06-plan.md): backlog con cada tarea, sus archivos, mockup, reglas y criterios de aceptación. **La siguiente tarea es la primera sin marcar.**
   - [`docs/02-casos-de-uso.md`](docs/02-casos-de-uso.md) si la tarea toca reglas de negocio.
   - El mockup de la pantalla en [`docs/mockups/`](docs/mockups/README.md).
2. **Antes de escribir**, revisa el código vecino y copia su estilo (nombres en español, comentario de cabecera con módulo y RF/CU, funciones pequeñas).
3. **Al terminar** una tarea:
   - `pnpm typecheck` y `pnpm build` sin errores (no hay tests ni lint todavía).
   - Prueba la pantalla con `pnpm dev` cuando aplique.
   - Marca la tarea en `docs/06-plan.md` y actualiza la sección **Estado** de este archivo.
   - Commit pequeño en español (ver Convenciones). No hagas push ni merge a `main` sin que el dueño lo pida.
4. **Si algo no está decidido** (marcado como *Propuesta* en los docs o ausente), constrúyelo como parámetro en la tabla `configuracion` o pregunta; no inventes reglas de negocio.

Fuente de verdad del negocio: Drive del proyecto (enlace en `docs/README.md`). El Drive todavía dice "BBB Bogotá" / `bbbbogota.com`: el nombre vigente es **Las 3B** y el dominio **lastresb.com.co**.

## Stack

- Monorepo **pnpm 10 + Turborepo**, Node 22 (`.nvmrc`). Rama de trabajo: `develop`; producción: `main`.
- `apps/web`: **Next.js 16** (App Router, TypeScript, Tailwind 4, alias `@/*` → `src/*`). Público + `/admin` + `/api/v1` + `/api/auth`.
- `packages/db`: **Drizzle ORM** sobre Postgres en **Supabase**, `casing: "snake_case"`, driver `postgres` con `prepare: false`. Migraciones en `packages/db/drizzle/`.
- Auth: **Better Auth** (correo + clave, Google, 2FA TOTP para backoffice). Config: `apps/web/src/lib/auth.ts`, cliente en `lib/auth-client.ts`.
- `packages/shared`: marca, localidades, `slugSchema`, `enlaceWhatsApp`. Lo usarán web y Expo.
- `apps/mobile`: reservado para Expo (fase 2). **No crear todavía.**

## Mapa del código

```
apps/web/src/app/
  page.tsx                 Home (buscador por localidad)
  (cuenta)/                /ingresar, /registro, /recuperar, /nueva-clave
  [slug]/page.tsx          Portafolio público
  admin/page.tsx           Backoffice (sin proteger aún)
  api/auth/[...all]        Handler de Better Auth
  api/v1/health            Salud de la API
  robots.ts, sitemap.ts, opengraph-image.tsx, manifest.ts, iconos/
apps/web/src/lib/
  auth.ts                  Config Better Auth
  portafolio.ts            obtenerPortafolio(slug): resolución pública por slug
  consentimientos.ts       Registro de consentimientos (versión, fecha, IP)
  correo.ts                enviarCorreo(): hoy imprime en consola
  seo.ts, og.tsx           JSON-LD y plantilla de imágenes OG
  demo.ts                  Recomendados de ejemplo (temporal, home)
  destino.ts               Redirección segura tras ingresar
apps/web/src/components/   Logo, TarjetaProveedor, cuenta (formularios), JsonLd, Analitica
packages/db/src/schema/    auth, catalogo, proveedores, contacto, cumplimiento
packages/db/src/seed.ts    Localidades, insignias, taxonomía y sinónimos
packages/shared/src/       marca, localidades, slug, whatsapp
docs/                      Visión, requerimientos, casos de uso, arquitectura, legal, marca, plan, mockups
```

## Comandos

```bash
pnpm dev                 # web en http://localhost:3000
pnpm typecheck
pnpm build
pnpm db:generate         # nueva migración tras cambiar packages/db/src/schema/*
pnpm db:migrate          # aplica migraciones a DATABASE_URL
pnpm db:seed             # localidades, insignias, taxonomía (idempotente)
pnpm db:studio
```

## Entorno (problemas ya resueltos)

- Variables en **`.env` (raíz)** y **`apps/web/.env.local`**, mismo contenido. Plantilla: `.env.example`. Nunca leas ni copies valores reales de `.env` o `vercel.txt` a otros archivos, commits o mensajes.
- `DATABASE_URL` debe ser el **Session pooler** de Supabase (`postgres.<id>@aws-X-<region>.pooler.supabase.com:5432`). La conexión directa `db.<id>.supabase.co` es solo IPv6 y falla con `EHOSTUNREACH`. En Vercel se usa el Transaction pooler (puerto 6543).
- Claves con símbolos deben ir codificadas en la URL.
- `drizzle-kit migrate` no muestra errores de conexión; probar con el comando `node --env-file` del README.
- `next/font/google` necesita internet en el build.
- Sin proveedor de correo: los enlaces de verificación y recuperación salen en la consola de `pnpm dev`.

## Estado

**Hecho (27 oct 2026)**
- Monorepo, typecheck y build de la web OK.
- Esquema completo (~40 tablas); migraciones `0000_inicial` y `0001_two_factor_bloqueo` **aplicadas en Supabase**.
- Semillas: 20 localidades, 4 insignias, 4 categorías padre + 26 subcategorías con sinónimos (`terminos_busqueda`).
- Home completa según mockups web y móvil, con recomendados de ejemplo (`lib/demo.ts`).
- SEO base: metadatos, Open Graph/X, `robots.ts`, `sitemap.ts`, JSON-LD, íconos PNG, GA4. Solo se indexa y mide con `VERCEL_ENV=production`.
- `/[slug]` resuelve en base: 301 desde slugs anteriores, "no disponible" si pausado, 404 si no publicado. Falta el diseño del mockup.
- P1 cuenta: `/ingresar`, `/registro` (mayoría de edad + consentimiento con versión/IP), `/recuperar`, `/nueva-clave`.
- Mockups del backoffice (BO_*) agregados en `docs/mockups/`.

**Siguiente:** ver [`docs/06-plan.md`](docs/06-plan.md).

**Diseño de referencia:** `docs/mockups/` (índice y rutas en `docs/mockups/README.md`). Implementa cada pantalla siguiendo su mockup: layout, copia, colores y tamaños. Faltan login y alta de proveedor en escritorio (usar los móviles como base). Logos vectoriales en `~/Descargas/logos-Las3B_banco-de-imagenes/svg` (fuera del repo).

## Reglas que no se rompen

1. **Datos privados nunca en público:** documento, dirección de notificaciones, RUT, fecha de nacimiento y archivos de `documentos` no salen en el portafolio ni en la API pública.
2. **Archivos privados** solo por URL firmada de 5 min desde el servidor; cada apertura se registra en `auditoria`.
3. **`auditoria` es solo inserción.** Nunca UPDATE ni DELETE.
4. **Una reseña por contacto** y solo con un clic de contacto previo.
5. **Consentimientos** con casilla no premarcada; guardar versión de política, fecha e IP.
6. **Solo proveedores `aprobado` o `en_revision`** aparecen en búsqueda; `pausado` muestra "no disponible"; `suspendido` y `rechazado` dan 404.
7. Lógica de negocio en funciones de servidor reutilizables (`apps/web/src/lib/*`); `/api/v1` y Server Actions solo las llaman (la app móvil no puede usar Server Actions).
8. Plazos, límites y días configurables viven en la tabla `configuracion`, no en constantes.
9. Copia en español de Colombia, tono de vecino, botones con verbo concreto ("Escribir por WhatsApp").
10. No commitear `.env*`, `vercel.txt` ni secretos.

## Convenciones

- Nombres de dominio en español (`proveedores`, `resenas`, `obtenerPortafolio`); TypeScript estricto.
- Cada archivo de `lib/` abre con un comentario: módulo (P1–P8, B1–B8), RF/CU que cubre y para quién es.
- Colores y tipografía: tokens de `apps/web/src/app/globals.css` (ver `docs/05-marca.md`). Verde `#0F6B5C` solo para contacto/éxito; botones neutros (Buscar, Continuar) en tinta `#1B2623`; Bricolage Grotesque para títulos, Inter para texto.
- Slugs: validar con `slugSchema` de `@las3b/shared`. Validación de entradas con `zod`.
- Tras cambiar el esquema: `pnpm db:generate` y revisar el SQL antes de `pnpm db:migrate`. SQL manual (extensiones, permisos) va como migración propia en `packages/db/drizzle/`.
- Commits en español, pequeños y descriptivos (ej. "Búsqueda por servicio y localidad con sinónimos").
