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
- P1 cuenta: `/ingresar`, `/registro` (mayoría de edad + consentimiento con versión/IP), `/recuperar`, `/nueva-clave`. Migración `0001` (columnas 2FA de Better Auth 1.7) aplicada.

**Pendiente, en orden sugerido**
1. **P2 Búsqueda** `/buscar?q=&localidad=&categoria=`: full-text en español sin tildes (`unaccent` + `pg_trgm`), sinónimos de `terminos_busqueda`, orden: coincidencia → cobertura de localidad → calificación (CU-01). Página de resultados según mockup "Resultados".
2. **P7 Portafolio** `/[slug]`: cargar proveedor `aprobado`/`en_revision`, 301 desde `slugs_historial`, "no disponible" si `pausado`, 404 si `suspendido`/`rechazado`, Open Graph (RF-37–43). Mockup "Perfil público".
3. **P4 Contacto**: ruta `/api/v1/contactos` que registra el clic y redirige a `wa.me` (`enlaceWhatsApp` de `@las3b/shared`).
4. **P1 pendientes**: conectar proveedor de correo en `apps/web/src/lib/correo.ts` (hoy los enlaces salen en consola); al primer ingreso con Google pedir mayoría de edad + consentimiento; textos reales de políticas (hoy `0.1-borrador`).
5. **P3 Alta de proveedor** en 3 pasos (datos básicos → qué ofreces y dónde → verificación con OTP, documento y dirección). Segmentos y RUT diferido 30 días (ver `docs/02-casos-de-uso.md`).
6. **Backoffice** `/admin`: proteger con sesión + rol + 2FA; cola de aprobación (B1).
7. Migración SQL manual: revocar UPDATE/DELETE sobre `auditoria`; extensiones `unaccent` y `pg_trgm`.
8. Páginas legales (`/terminos`, `/privacidad`, `/reclamos`) con los textos del Drive (carpeta "Textos legales").

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
