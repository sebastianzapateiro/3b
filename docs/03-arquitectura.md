# Arquitectura

## Estilo

**Monolito modular** en Next.js (App Router + TypeScript) dentro de un **monorepo pnpm + Turborepo**. La web, el backoffice (`/admin`) y la API (`/api/v1`) son una sola app desplegable. La app móvil (Expo, fase 2) consume solo la API.

```
apps/web          Next.js 16: sitio público PWA, /panel, /admin, /api/v1, /api/auth
apps/mobile       Expo (fase 2)
packages/db       Drizzle ORM: esquema, migraciones, semillas
packages/shared   Marca, localidades, reglas de slug, WhatsApp, validaciones zod
packages/config   tsconfig base
```

## Módulos

**Públicos:** P1 cuenta · P2 catálogo y búsqueda · P3 perfil de proveedor · P4 contacto · P5 reseñas · P6 legal público · P7 portafolio · P8 estadísticas del proveedor.
**Backoffice:** B1 proveedores · B2 insignias · B3 moderación de contenido · B4 usuarios y roles · B5 taxonomía · B6 cumplimiento · B7 métricas · B8 auditoría y configuración.

Cada módulo es dueño de sus tablas y servicios. La lógica vive en funciones de servidor reutilizables; las rutas `/api/v1` y las Server Actions solo las llaman, para que la app móvil use lo mismo.

## Roles

Conjunto de roles por usuario (`usuario_roles`): `comprador`, `proveedor`, `verificador`, `moderador`, `admin`. Una persona puede ser comprador y proveedor. Ver matriz de permisos en Drive (Arquitectura, módulos y roles §4).

## Autenticación (Better Auth)

- Correo y clave (hash), verificación de correo, recuperación que revoca sesiones.
- Google OAuth; en iOS también Apple (exigencia de la App Store).
- Al primer ingreso con Google: declarar mayoría de edad y aceptar términos.
- OTP de 6 dígitos para el WhatsApp del proveedor (5 min, 3 intentos, bloqueo 15 min). No es login.
- **2FA (TOTP) obligatorio** para roles de backoffice; sesión de 8 h.
- Sesión pública: 30 días en cookie httpOnly. Móvil: token corto + refresh rotativo.
- Vincular Google a una cuenta existente solo si ambos correos están verificados.
- Captcha tras 3 fallos; bloqueo y aviso tras 5 fallos en 15 min.

**Implementado (29 oct 2026):**
- `src/proxy.ts` (convención de Next 16, runtime Node.js) exige sesión en `/admin`, `/cuenta`, `/panel` y `/proveedores`, y manda a `/consentimiento` a quien no tenga consentimiento vigente (Google, invitados).
- Backoffice: `lib/verificacion.ts` exige rol `verificador`/`moderador`/`admin` + 2FA activo. Ingreso en `/admin/ingresar`; la primera vez muestra un QR (clave manual como respaldo) y códigos de respaldo.
- El admin crea cuentas en `/admin/usuarios`: la cuenta nace sin clave y recibe un enlace de invitación a `/nueva-clave` (vigencia en `configuracion`, `invitacion_vigencia_h`). El primer admin se crea con `pnpm admin:crear`.
- Límite de peticiones de Better Auth: 30 por minuto.
- Sesión del equipo: `lib/verificacion.ts` cierra la sesión si pasaron más de `sesion_backoffice_h` horas (8) desde el ingreso y manda a `/admin/ingresar?vencida=1`. «Confiar en este equipo» dura 8 h (`trustDeviceMaxAge`).
- 2FA al ingresar: `/ingresar` y `/admin/ingresar` comparten `components/SegundoFactor.tsx` (código TOTP o código de respaldo de un solo uso).
- **Pendiente:** OTP real por WhatsApp (hoy en consola), captcha, Apple.

## Datos

PostgreSQL en Supabase con búsqueda full-text en español. Esquema en `packages/db/src/schema/`:

| Archivo | Tablas |
|---|---|
| `auth.ts` | user, session, account, verification, two_factor, usuario_roles |
| `catalogo.ts` | categorias (2 niveles), localidades, terminos_busqueda, barrios |
| `proveedores.ts` | proveedores, proveedor_categorias, proveedor_localidades, servicios_proveedor, slugs_historial, portafolio_fotos, documentos, insignias, proveedor_insignias, consultas_inhabilidades |
| `contacto.ts` | contactos, servicios, resenas, respuestas_resena, reportes, acciones_moderacion |
| `cumplimiento.ts` | politicas, consentimientos, reclamos, solicitudes_datos, auditoria, festivos, configuracion |

Decisiones: una reseña por contacto · documento cifrado y archivos en bucket privado · promedios en caché en `proveedores` · consentimientos apuntan a la versión exacta de la política · `auditoria` de solo inserción (disparador que rechaza UPDATE, DELETE y TRUNCATE).

### Datos privados

- **Número de documento:** cifrado en la aplicación con AES-256-GCM (`packages/db/src/cifrado.ts`), formato `v1:<iv>:<cifrado>`. La clave `DOCUMENTOS_CLAVE` vive solo en variables de entorno; la base nunca la ve. `documento_huella` (HMAC-SHA256) permite detectar duplicados sin descifrar. Solo se descifra para la entrega de datos del art. 53 (auditada).
- **Archivos:** Supabase Storage. `privado` (JPG, PNG, HEIC, PDF; 10 MB; sin políticas, solo el servidor con la service role key; lectura por URL firmada de 5 min auditada) y `publico` (JPG, PNG, WebP; 5 MB; fotos tras moderación). Subida: el servidor firma una URL de un solo uso con nombre aleatorio, el navegador sube directo (Vercel no admite cuerpos de más de 4,5 MB) y el servidor confirma el tipo real por la firma de bytes antes de registrarlo; si no cumple, lo borra. Requisitos por segmento y categoría en `documentosExigidos` (`lib/documentos.ts`), única fuente para alta, panel y backoffice. Pendiente: antivirus.
- **Pendiente de decidir:** cifrar también dirección de notificaciones y fecha de nacimiento.

## Infraestructura (MVP)

| Capa | Servicio |
|---|---|
| Borde | Cloudflare (DNS, CDN, TLS, WAF, Turnstile) |
| App | Vercel (web, backoffice, API) |
| Datos | Supabase (Postgres con PITR, Storage público y privado). Elegir región y declararla en la política de datos (transferencia internacional, Ley 1581) |
| Móvil | Expo EAS (fase 2) |
| Automatizaciones | n8n en VPS con Docker: recordatorios, depuración, respaldo externo diario cifrado |
| Operación | GitHub Actions, Sentry |

Ambientes: desarrollo, staging y producción, cada uno con su base y su storage.

## Seguridad operativa

Secretos solo en variables de entorno por ambiente · la app móvil nunca habla con la base · storage privado solo desde la API con URL firmada · respaldo diario cifrado y restauración probada cada mes.
