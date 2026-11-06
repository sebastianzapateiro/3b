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
   - `pnpm typecheck`, `pnpm test` (vitest, solo lógica pura en `apps/web/src/**/*.test.ts`) y `pnpm build` sin errores (no hay lint todavía).
   - Prueba la pantalla con `pnpm dev` cuando aplique.
   - Marca la tarea en `docs/06-plan.md` y actualiza la sección **Estado** de este archivo.
   - Si cambió la arquitectura (servicios, tablas, flujos de seguridad), actualiza el diagrama en `docs/07-diagramas.md` y corre `pnpm docs:diagramas`.
   - Commit pequeño en español (ver Convenciones). No hagas push ni merge a `main` sin que el dueño lo pida.
4. **Si algo no está decidido** (marcado como *Propuesta* en los docs o ausente), constrúyelo como parámetro en la tabla `configuracion` o pregunta; no inventes reglas de negocio.

Fuente de verdad del negocio: Drive del proyecto (enlace en `docs/README.md`). El Drive todavía dice "BBB Bogotá" / `bbbbogota.com`: el nombre vigente es **LasTresB** (antes «Las 3B» en algunos textos) y el dominio **lastresb.com.co**.

## Stack

- Monorepo **pnpm 10 + Turborepo**, Node 22 (`.nvmrc`). Rama de trabajo: `develop`; producción: `main`.
- `apps/web`: **Next.js 16** (App Router, TypeScript, Tailwind 4, alias `@/*` → `src/*`). Público + `/admin` + `/api/v1` + `/api/auth`.
- `packages/db`: **Drizzle ORM** sobre **Postgres 17 en el VPS** (antes Supabase), `casing: "snake_case"`, driver **node-postgres (`pg`)**, no postgres.js: con el pooler de Supabase, postgres.js entrevera consultas («invalid frontend message type») y se cuelgan. SQL a mano con `consultar<T>(sql`…`)` de `@las3b/db` (devuelve filas con fechas como `Date`; `db.execute` las devuelve como texto). Migraciones en `packages/db/drizzle/`.
- Auth: **Better Auth** (correo + clave, Google, 2FA TOTP para backoffice). Config: `apps/web/src/lib/auth.ts`, cliente en `lib/auth-client.ts`.
- `packages/shared`: marca, localidades, categorías, `slugSchema`, `enlaceWhatsApp`, `PARAMETROS`, días hábiles. Lo usarán web y Expo (sin dependencias de Node).
- Storage: **Supabase Storage**, buckets `privado` (documentos, sin políticas: solo el servidor con service role) y `publico` (fotos). Probados el 29 oct 2026.
- Cifrado: `packages/db/src/cifrado.ts` (AES-256-GCM + huella HMAC, clave `DOCUMENTOS_CLAVE`). Solo servidor.
- `apps/mobile`: reservado para Expo (fase 2). **No crear todavía.**

## Mapa del código

```
apps/web/src/
  proxy.ts                 Sesión + consentimiento en zonas privadas (Next 16 «proxy», runtime Node.js)
  app/
    page.tsx               Home
    ingreso/               Ingreso y registro únicos (cliente o proveedor); /ingresar y /registro redirigen aquí (301)
    (cuenta)/              /recuperar, /nueva-clave (también invitaciones), /consentimiento
    consentimiento/        Aceptación obligatoria para quien no tiene consentimiento vigente (Google, invitados)
    cuenta/                Mi cuenta, actividad, privacidad
    buscar/                P2 resultados
    [slug]/                P7 portafolio, calificar (P5), OG por proveedor
    servicios/, categorias/, localidades/, guias/   Páginas SEO por oficio y localidad
    proveedores/registro/  P3 crea el borrador y redirige a /panel (page.tsx, no route handler: la Server Action de Google no seguía el 307; enlaces con prefetch={false})
    panel/                 Panel del proveedor: tareas del alta en el Resumen, perfil (+ datos del negocio en borrador), servicios, reseñas, verificación (+ identidad en borrador); confirmar (acepta términos y envía a revisión)
    reclamos/, reportar/   Formularios públicos (CU-10/11, reportes)
    terminos/, terminos-proveedores/, privacidad/, cookies/, resenas/, retiro-de-contenido/   Legales
    admin/ingresar/        Ingreso del equipo: clave + 2FA (QR la primera vez)
    admin/(panel)/         B1–B8: tablero, aprobaciones, proveedores/[id], proveedores/nuevo, moderacion,
                           usuarios (crear, roles, suspender), catalogo, cumplimiento, auditoria
    api/auth/[...all]      Better Auth
    admin/documentos/[id]  Abre un documento privado: auditoría + redirección a URL firmada
    api/v1/                health, yo, yo/documentos (+ /subida), admin/proveedores/[id]/documentos (+ /subida), contactos (+ /ir: registra clic y redirige a wa.me), consentimientos, politicas
  lib/                     Lógica de negocio (regla 7): alta-proveedor (borrador y tareas del alta), documentos (requisitos, subida, apertura), almacenamiento (Storage REST), invitaciones (enlace de clave, estado, WhatsApp), busqueda, portafolio(-completo), resenas, panel, admin,
                           moderacion, cumplimiento, auditoria(-consulta), parametros, verificacion (guardia backoffice),
                           consentimientos, correo (Resend o consola), seo, seo-servicios, publicacion, guias, faqs
  components/              UI pública; components/admin/ para el backoffice
packages/db/src/
  schema/                  auth, catalogo, proveedores, contacto, cumplimiento
  cifrado.ts               cifrar, descifrar, huella, protegerDocumento
  seed.ts                  Localidades, insignias, taxonomía y sinónimos
  admin-crear.ts           pnpm admin:crear <correo>
  cifrar-documentos.ts     pnpm db:cifrar-documentos [--aplicar]
packages/shared/src/       marca, localidades, categorias, slug, whatsapp, parametros, habiles, politicas, motivos
docs/                      Visión, requerimientos, casos de uso, arquitectura, legal, marca, plan, mockups
```

## Comandos

```bash
pnpm dev                    # web en http://localhost:3000
pnpm typecheck
pnpm test                   # vitest (lógica pura: códigos, mensajes de WhatsApp, ubicación)
pnpm build                  # usa --force si cambiaste variables de entorno (Turborepo cachea el build)
pnpm db:generate            # nueva migración tras cambiar packages/db/src/schema/*
pnpm db:migrate             # aplica migraciones a DATABASE_URL
pnpm db:seed                # localidades, insignias, taxonomía (idempotente)
pnpm db:studio
pnpm usuarios [rol|texto]   # lista las cuentas (solo lectura)
pnpm admin:crear <correo>   # rol admin a una cuenta existente (primer admin)
pnpm db:cifrar-documentos   # cuenta documentos en texto plano; --aplicar los cifra
pnpm docs:diagramas         # SVG de docs/diagramas/ desde docs/07-diagramas.md (usa el Chrome instalado)
```

## Entorno (problemas ya resueltos)

- Variables en **`.env` (raíz)** y **`apps/web/.env.local`**, mismo contenido. Plantilla: `.env.example` (solo nombres, **nunca valores reales**). Nunca leas ni copies valores reales de `.env` o `vercel.txt` a otros archivos, commits o mensajes. Next solo lee `apps/web/.env.local`; los scripts de `packages/db` leen el `.env` de la raíz.
- Variables nuevas: declararlas también en `globalEnv` de `turbo.json`.
- **La base es la de producción en el VPS** y no tiene puerto público. En local, `DATABASE_URL` va por túnel SSH: `postgresql://lastresb:…@127.0.0.1:5433/lastresb`. Abre el túnel con `ssh -fN lastresb-db` antes de `pnpm dev` o `pnpm db:*` (sin túnel: `ECONNREFUSED 127.0.0.1:5433`). **Todo lo que hagas en local escribe en producción**; `db:migrate` y `db:seed` también. Ver `infra/vps/README.md`.
- Claves con símbolos deben ir codificadas en la URL.
- `drizzle-kit migrate` no muestra errores de conexión; los avisos `NOTICE ... already exists, skipping` son normales.
- `next/font/google` necesita internet en el build.
- **No corras `pnpm build` con `pnpm dev` abierto:** comparten `apps/web/.next` y el servidor de desarrollo queda dañado (botones y acciones que «no hacen nada»). Si pasó: detén `pnpm dev`, borra `apps/web/.next` y vuelve a arrancarlo.
- Sin `RESEND_API_KEY`: los enlaces de verificación, recuperación e invitación salen en la consola de `pnpm dev`.
- **Next 16:** el archivo es `src/proxy.ts` (no `middleware.ts`). `middleware.ts` corre en Edge, donde el driver de Postgres no conecta («Failed to get session»).
- Sin `BETTER_AUTH_SECRET` Better Auth usa una clave pública por defecto: el build lo avisa con «default secret».
- En el VPS la web y la base están en el mismo servidor (latencia ~0). Better Auth usa `cookieCache` (5 min): cambios al usuario hechos con SQL directo no se ven en `getSession` hasta que vence; para datos que el usuario edita usa `auth.api.updateUser`.
- En el contenedor Next corre con `HOSTNAME=0.0.0.0`: en route handlers `request.url` sale como `https://0.0.0.0:3000/…`. Para redirigir usa `redirigir()` / `origenPublico()` de `lib/redireccion.ts`, nunca `new URL(ruta, request.url)`.
- Postgres del VPS admite 60 conexiones; la app usa un pool de 3 (`DB_POOL_MAX`) y el build 1.

## Estado

**Hecho (hasta 29 oct 2026)**
- Esquema completo (~40 tablas). Migraciones `0000`–`0010` aplicadas en Supabase (1 nov 2026). `0003_auditoria_solo_insercion` (disparador) y `0010_extensiones_busqueda`: `unaccent` y `pg_trgm` en el esquema `extensions`, `f_unaccent()` inmutable, índices trigram sobre `f_unaccent(lower(...))` que usa `lib/busqueda.ts`, y sin UPDATE/DELETE/TRUNCATE sobre `auditoria` para ningún rol. Portable a un Postgres propio.
- Semillas: 20 localidades, insignias, taxonomía por oficios con sinónimos, festivos de Colombia.
- Público: home, `/buscar`, `/[slug]` con diseño completo y OG, contacto `/api/v1/contactos/ir`, reseñas (`/[slug]/calificar`), SEO por oficio y localidad, guías, legales, `/reclamos`, `/reportar`.
- Cuenta: registro, ingreso, recuperación, Google, consentimiento obligatorio, Mi cuenta. Correo con Resend (o consola).
- Proveedor: alta dentro del panel (2 nov 2026): al elegir «proveedor» se crea el borrador y entra a `/panel`, que lista las tareas pendientes hasta enviar a revisión (`lib/alta-proveedor.ts`). Documento cifrado con AES-256-GCM + huella. Carga de documentos al bucket `privado` (URL firmada + validación de tipo real) en el alta y en el panel; el equipo los abre por `/admin/documentos/[id]` con auditoría.
- Backoffice B1–B8 con rol + 2FA (QR al configurar; `/ingreso` también pide el código; códigos de respaldo utilizables; sesión del equipo de 8 h por `sesion_backoffice_h`; «confiar en este equipo» 8 h; 2FA obligatorio para admin y configurable para verificador y moderador en `/admin/usuarios`), creación de usuarios con invitación por correo, cambio de clave de una cuenta por un admin (`lib/claves.ts`: cierra sesiones, anula invitaciones y avisa por correo), auditoría de solo inserción, parámetros en `configuracion`.
- **Despliegue continuo (2 nov 2026):** push a `main` → GitHub Actions → `/opt/lastresb/desplegar.sh` en el VPS (con vuelta atrás si no responde). Migraciones a mano antes del merge. Ver `infra/vps/README.md` § Despliegue continuo.
- **Producción en VPS Hostinger desde el 1 nov 2026:** `https://www.lastresb.com.co` (Docker: Postgres 17 + web standalone; nginx + certbot en el host; respaldo diario). La base ya **no** es Supabase; Storage sí sigue en Supabase. Ver `infra/vps/README.md`. Vercel queda fuera.
- **Eliminar cuenta (3 nov 2026, CU-27):** admin en `/admin/usuarios`, confirma con el correo (`lib/eliminar-cuenta.ts`). Sin historial se borra con sus archivos; con historial se bloquea (`eliminado_en`, `conservar_hasta` por `conservacion_eliminados_anios`), perfil oculto y reseñas anónimas. `auth.ts` no crea sesión para cuentas eliminadas ni suspendidas.
- **Registro solo de proveedores (5 nov 2026):** `/ingreso` es ingreso y registro de proveedores (nombre, correo, WhatsApp, clave y 1 a 3 oficios); crea el perfil y lleva a crear servicios. El cliente solo se registra al calificar (`destino` `/…/calificar`) y deja nombre y WhatsApp al contactar. Franja «Completa tu perfil» en el panel hasta que no falte ningún paso. Botón flotante de ayuda para proveedores (`components/ayuda/`, `solicitudes_ayuda_inscripcion`, `/admin/solicitudes-ayuda`; migración `0018` aplicada el 5 nov 2026), conteo de clics (`ClicsAnalitica`, `NEXT_PUBLIC_GTM_ID`) y `/proveedores` (reemplaza `/buscar` y `/categorias`).
- UI: cursor de mano global en elementos pulsables (`globals.css`).
- **Analítica (6 nov 2026):** Google Tag Manager `GTM-P3DSRWVH` (`NEXT_PUBLIC_GTM_ID` en `build.env` y `web.env` del VPS) con modo de consentimiento de Google: sin permiso, GA4 sin cookies; al aceptar, cookies `_ga`. El contenedor (etiqueta de Google `G-LJPS2R11K6` + clics) está en `infra/gtm/contenedor-lastresb.json`. Clics con nombre fijo por `data-evento` (`menu_proveedores`, `home_buscar`, `menu_ingreso_proveedores`); con Tag Manager no se llama a `gtag()` (duplicaba eventos).

**Deuda abierta (ver plan):**
- VPS (2 nov 2026): Resend y Google OAuth configurados en local y en el servidor; falta DMARC (`_dmarc`, `p=none`) en Cloudflare. Quizá faltan `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GA_ID`, `GOOGLE_SITE_VERIFICATION`; respaldos fuera del VPS; quitar el dominio en Vercel; permisos del usuario `desarrollo`. Ver `infra/vps/README.md` § Pendiente.
- Autorización Ley 1918: el alta la firma con casilla, pero el backoffice la marca como «Falta» si no hay archivo; unificar criterio.
- Fotos del portafolio al bucket `publico` (aún no hay carga).
- OTP real por WhatsApp (hoy en consola).
- `GET /api/v1/proveedores`; límites de clics repetidos en contacto; `POST /api/v1/contactos` antiguo por unificar.
- Seguridad: una `DATABASE_URL` de Supabase quedó en el historial de git (commit `5a12a79`); ya no es producción, pero rotar esa clave o apagar la base de Supabase.

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
