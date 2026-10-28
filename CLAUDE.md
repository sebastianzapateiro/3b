# Las 3B — guía para agentes

Directorio de servicios y oficios en Bogotá: el comprador busca por servicio y localidad y contacta al proveedor directo por WhatsApp. Gratis, sin comisiones. Las 3B es un **portal de contacto**, no intermediario de pagos ni garante del servicio.

Antes de cambiar reglas de negocio lee `docs/` (sobre todo `docs/02-casos-de-uso.md`). Fuente de verdad: Drive del proyecto (enlace en `docs/README.md`). El Drive todavía dice "BBB Bogotá" / `bbbbogota.com`: el nombre vigente es **Las 3B** y el dominio **lastresb.com.co**.

Dueño: Sebastián Zapateiro. Responde en español, conciso. Analiza y muestra hallazgos antes de cambios grandes; confirma alcance antes de entregas largas.

## Stack

- Monorepo **pnpm 10 + Turborepo**, Node 22.
- `apps/web`: **Next.js 16** (App Router, TypeScript, Tailwind 4, alias `@/*` → `src/*`). Público + `/admin` + `/api/v1` + `/api/auth`.
- `packages/db`: **Drizzle ORM** sobre Postgres en **Supabase**, `casing: "snake_case"`, driver `postgres` con `prepare: false`.
- Auth: **Better Auth** (correo + clave, Google, 2FA TOTP para backoffice). Config: `apps/web/src/lib/auth.ts`.
- `packages/shared`: marca, localidades, `slugSchema`, enlace WhatsApp. Lo usarán web y Expo.
- `apps/mobile`: reservado para Expo (fase 2). No crear todavía.

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

- Variables en **`.env` (raíz)** y **`apps/web/.env.local`**, mismo contenido. Plantilla: `.env.example`.
- `DATABASE_URL` debe ser el **Session pooler** de Supabase (`postgres.<id>@aws-X-<region>.pooler.supabase.com:5432`). La conexión directa `db.<id>.supabase.co` es solo IPv6 y falla con `EHOSTUNREACH` en la red del dueño.
- Claves con símbolos deben ir codificadas en la URL.
- `drizzle-kit migrate` no muestra errores de conexión; probar con el comando `node --env-file` del README.
- `next/font/google` necesita internet en el build.

## Estado y siguientes pasos

**Hecho (27 oct 2026)**
- Monorepo, typecheck y build de la web OK.
- Esquema completo (~40 tablas) en `packages/db/src/schema/`; migración `0000_inicial` **aplicada en Supabase**.
- Semillas cargadas: 20 localidades, 4 insignias, 4 categorías padre + 26 subcategorías con sinónimos (`terminos_busqueda`).
- Home con buscador por localidad (`apps/web/src/app/page.tsx`), logo y tokens de marca.
- Páginas base sin datos: `/[slug]` (portafolio), `/admin`, `/api/v1/health`, handler de Better Auth.
- Home completa según mockups web y móvil, con recomendados de ejemplo (`apps/web/src/lib/demo.ts`).
- SEO base: metadatos, Open Graph/X con imagen generada, `robots.ts`, `sitemap.ts`, JSON-LD (`lib/seo.ts`), íconos PNG, GA4. Solo se indexa y mide con `VERCEL_ENV=production`.
- `/[slug]` resuelve en base (`lib/portafolio.ts`): 301 desde slugs anteriores, "no disponible" si pausado, 404 si no publicado.
- P1 cuenta: `/ingresar`, `/registro` (mayoría de edad + consentimiento con versión/IP), `/recuperar`, `/nueva-clave`. Migración `0001` (columnas 2FA de Better Auth 1.7) aplicada.
- Página `/buscar` con búsqueda de proveedores (P2): full-text en español (`unaccent` + `pg_trgm`), sinónimos de `terminos_busqueda`, orden coincidencia → cobertura de localidad → calificación (CU-01), resultados según mockup "Resultados". Migración `0002_busqueda` aplicada (extensiones y regla de auditoría sobre `auditoria`).
- Página `/[slug]` con portafolio completo (P7): datos reales del proveedor, servicios con precios, galería de fotos, insignias, reseñas y botón WhatsApp, según mockups Perfil_web/Perfil_movil. JSON-LD LocalBusiness y Open Graph por proveedor.
- Ruta `POST /api/v1/contactos` (P4, CU-05): registra el clic en tabla `contactos` (compradorId si hay sesión, anonimoId si no) y redirige 302 a `wa.me` con mensaje prellenado (`enlaceWhatsApp` de `@las3b/shared`). Cookie `anonimo_id` de 30 días para visitantes anónimos.
- `apps/web/src/lib/correo.ts`: envío real vía Resend (fetch a API de Resend si `RESEND_API_KEY` está definida), fallback a consola si no.
- Página `/cuenta/consentimiento` (P1 pendientes, RF-19, CU-76): aceptar mayoría de edad y políticas esenciales con casillas no premarcadas. API `GET /api/v1/politicas/vigentes` y `POST /api/v1/consentimientos`.
- Middleware: redirige a usuarios autenticados sin consentimientos a `/cuenta/consentimiento`.
- `seed.ts`: textos de políticas versión 1.0 con redacción definitiva (exoneración de responsabilidad: plataforma de tráfico; responsable y conversación entre proveedor y cliente).
- Alta de proveedor en 3 pasos (P3): `/proveedores/registro` con wizard (datos básicos → qué ofreces y dónde → verificación + OTP), guardado vía Server Actions, estados `borrador → pendiente`. RUT obligatorio para segmento empresa o categoría de riesgo alto; independientes sin RUT tienen 30 días para cargar (→ `pausado_por_rut`).
- Backoffice `/admin` con protección sesión + rol + 2FA y cola de aprobación (`buscarPendientes`, actions `aprobar/rechazar`, API `/api/v1/admin/*`).
- Páginas legales (`/terminos`, `/privacidad`, `/reclamos`): creadas con texto vigente que exime a Las 3B de responsabilidad por la prestación del servicio — es solo plataforma de tráfico que verifica datos básicos; la responsabilidad y conversación contractual son entre proveedor y cliente.
- Textos legales definitivos (redacción del modelo, pendiente de tu revisión): versiones 1.0 en `seed.ts` (`terminos_compradores`, `tratamiento_datos`) y contenido en `/terminos`, `/privacidad`, `/reclamos`.
- Variables locales: `BETTER_AUTH_SECRET` generado (`openssl rand -base64 32`); build de producción sin errores de BetterAuth.

**Pendiente, en orden sugerido**
1. Completar variables de entorno restantes (`RESEND_API_KEY`, `SUPABASE_*`, `GOOGLE_*`) y deploy en Vercel con dominio `lastresb.com.co`.

**Diseño de referencia:** `docs/mockups/` (copia del lienzo "Las 3B — Mockups v0.3"; índice y rutas en `docs/mockups/README.md`). Implementa cada pantalla siguiendo su mockup: layout, copia, colores y tamaños. Faltan login y alta de proveedor en versión escritorio. Logos vectoriales en `~/Descargas/logos-Las3B_banco-de-imagenes/svg`.

## Reglas que no se rompen

1. **Datos privados nunca en público:** documento, dirección de notificaciones, RUT, fecha de nacimiento y archivos de `documentos` no salen en el portafolio ni en la API pública.
2. **Archivos privados** solo por URL firmada de 5 min desde el servidor; cada apertura se registra en `auditoria`.
3. **`auditoria` es solo inserción.** Nunca UPDATE ni DELETE.
4. **Una reseña por contacto** y solo con un clic de contacto previo.
5. **Consentimientos** con casilla no premarcada; guardar versión de política, fecha e IP.
6. **Solo proveedores `aprobado` o `en_revision`** aparecen en búsqueda; `pausado` muestra "no disponible"; `suspendido` y `rechazado` dan 404.
7. Lógica de negocio en funciones de servidor reutilizables; `/api/v1` y Server Actions solo las llaman (la app móvil no puede usar Server Actions).
8. Plazos, límites y días configurables viven en la tabla `configuracion`, no en constantes.
9. Copia en español de Colombia, tono de vecino, botones con verbo concreto ("Escribir por WhatsApp").
10. No commitear `.env*` ni secretos.

## Convenciones

- Nombres de dominio en español (`proveedores`, `resenas`); TypeScript estricto.
- Colores y tipografía: tokens de `apps/web/src/app/globals.css` (ver `docs/05-marca.md`). Verde solo para contacto/éxito; botones neutros (Buscar, Continuar) en tinta; Bricolage Grotesque para títulos, Inter para texto.
- Slugs: validar con `slugSchema` de `@las3b/shared`.
- Tras cambiar el esquema: `pnpm db:generate` y revisar el SQL antes de `pnpm db:migrate`.
- Commits en español, pequeños y descriptivos.
