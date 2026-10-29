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

Fuente de verdad del negocio: Drive del proyecto (enlace en `docs/README.md`). El Drive todavía dice "BBB Bogotá" / `bbbbogota.com`: el nombre vigente es **LasTresB** (antes «Las 3B» en algunos textos) y el dominio **lastresb.com.co**.

## Stack

- Monorepo **pnpm 10 + Turborepo**, Node 22 (`.nvmrc`). Rama de trabajo: `develop`; producción: `main`.
- `apps/web`: **Next.js 16** (App Router, TypeScript, Tailwind 4, alias `@/*` → `src/*`). Público + `/admin` + `/api/v1` + `/api/auth`.
- `packages/db`: **Drizzle ORM** sobre Postgres en **Supabase**, `casing: "snake_case"`, driver `postgres` con `prepare: false`. Migraciones en `packages/db/drizzle/`.
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
    (cuenta)/              /ingresar, /registro, /recuperar, /nueva-clave (también invitaciones)
    consentimiento/        Aceptación obligatoria para quien no tiene consentimiento vigente (Google, invitados)
    cuenta/                Mi cuenta, actividad, privacidad
    buscar/                P2 resultados
    [slug]/                P7 portafolio, calificar (P5), OG por proveedor
    servicios/, categorias/, localidades/, guias/   Páginas SEO por oficio y localidad
    proveedores/registro/  P3 alta en 3 pasos (borrador → pendiente)
    panel/                 Panel del proveedor: perfil, servicios, reseñas, verificación
    reclamos/, reportar/   Formularios públicos (CU-10/11, reportes)
    terminos/, terminos-proveedores/, privacidad/, cookies/, resenas/, retiro-de-contenido/   Legales
    admin/ingresar/        Ingreso del equipo: clave + 2FA (QR la primera vez)
    admin/(panel)/         B1–B8: tablero, aprobaciones, proveedores/[id], proveedores/nuevo, moderacion,
                           usuarios (crear, roles, suspender), catalogo, cumplimiento, auditoria
    api/auth/[...all]      Better Auth
    api/v1/                health, yo, contactos (+ /ir: registra clic y redirige a wa.me), consentimientos, politicas
  lib/                     Lógica de negocio (regla 7): busqueda, portafolio(-completo), resenas, panel, admin,
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
pnpm build                  # usa --force si cambiaste variables de entorno (Turborepo cachea el build)
pnpm db:generate            # nueva migración tras cambiar packages/db/src/schema/*
pnpm db:migrate             # aplica migraciones a DATABASE_URL
pnpm db:seed                # localidades, insignias, taxonomía (idempotente)
pnpm db:studio
pnpm admin:crear <correo>   # rol admin a una cuenta existente (primer admin)
pnpm db:cifrar-documentos   # cuenta documentos en texto plano; --aplicar los cifra
```

## Entorno (problemas ya resueltos)

- Variables en **`.env` (raíz)** y **`apps/web/.env.local`**, mismo contenido. Plantilla: `.env.example` (solo nombres, **nunca valores reales**). Nunca leas ni copies valores reales de `.env` o `vercel.txt` a otros archivos, commits o mensajes. Next solo lee `apps/web/.env.local`; los scripts de `packages/db` leen el `.env` de la raíz.
- Variables nuevas: declararlas también en `globalEnv` de `turbo.json`.
- `DATABASE_URL` debe ser el **Session pooler** de Supabase (`postgres.<id>@aws-X-<region>.pooler.supabase.com:5432`). La conexión directa `db.<id>.supabase.co` es solo IPv6 y falla con `EHOSTUNREACH`. En Vercel se usa el Transaction pooler (puerto 6543).
- Claves con símbolos deben ir codificadas en la URL.
- `drizzle-kit migrate` no muestra errores de conexión; los avisos `NOTICE ... already exists, skipping` son normales.
- `next/font/google` necesita internet en el build.
- Sin `RESEND_API_KEY`: los enlaces de verificación, recuperación e invitación salen en la consola de `pnpm dev`.
- **Next 16:** el archivo es `src/proxy.ts` (no `middleware.ts`). `middleware.ts` corre en Edge, donde el driver `postgres` no conecta («Failed to get session»).
- Sin `BETTER_AUTH_SECRET` Better Auth usa una clave pública por defecto: el build lo avisa con «default secret».

## Estado

**Hecho (hasta 29 oct 2026)**
- Esquema completo (~40 tablas). Migraciones aplicadas en Supabase: `0000_inicial`, `0001_two_factor_bloqueo`, `0002_bright_luke_cage`, `0003_auditoria_solo_insercion` (disparador), `0004_documento_huella`. `0002_busqueda.sql` está suelta, fuera del journal (no se aplica).
- Semillas: 20 localidades, insignias, taxonomía por oficios con sinónimos, festivos de Colombia.
- Público: home, `/buscar`, `/[slug]` con diseño completo y OG, contacto `/api/v1/contactos/ir`, reseñas (`/[slug]/calificar`), SEO por oficio y localidad, guías, legales, `/reclamos`, `/reportar`.
- Cuenta: registro, ingreso, recuperación, Google, consentimiento obligatorio, Mi cuenta. Correo con Resend (o consola).
- Proveedor: alta en 3 pasos con borrador y panel (`/panel`). Documento cifrado con AES-256-GCM + huella.
- Backoffice B1–B8 con rol + 2FA (QR al configurar), creación de usuarios con invitación por correo, auditoría de solo inserción, parámetros en `configuracion`.
- UI: cursor de mano global en elementos pulsables (`globals.css`).

**Deuda abierta (ver plan):**
- Subida de archivos al bucket `privado` y «Abrir documento» con URL firmada de 5 min (regla 2). Buckets ya creados.
- OTP real por WhatsApp (hoy en consola).
- Sesión de 8 h del backoffice: documentada pero no aplicada (hoy 30 días).
- `/ingresar` no sabe pedir el código 2FA: una cuenta con 2FA debe entrar por `/admin/ingresar`.
- `GET /api/v1/proveedores`; límites de clics repetidos en contacto; `POST /api/v1/contactos` antiguo por unificar.
- Seguridad: una `DATABASE_URL` real quedó en el historial de git (commit `5a12a79`); rotar la clave de la base.

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
