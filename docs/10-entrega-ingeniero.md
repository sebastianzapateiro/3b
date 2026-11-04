# Entrega al ingeniero — 4 de noviembre de 2026

Rama `develop`. Nada de esto está desplegado. **Orden para activarlo:**

1. `pnpm install`
2. `pnpm db:migrate` — aplica 0011 a 0017 (ver abajo).
3. `pnpm db:seed` — crea los oficios nuevos, actualiza las palabras clave y sube las versiones de las políticas (tratamiento de datos 2.3, declaración de servicios no permitidos 1.1).
4. Definir las variables de entorno nuevas (abajo) y programar el cron de avisos.
5. Verificar el dominio `lastresb.com.co` en Resend (SPF, DKIM, DMARC) antes de usar `notificaciones@`.

## Migraciones pendientes (ninguna aplicada)
| N.º | Qué hace |
|---|---|
| 0011 | Seguimiento de solicitudes (5 estados, tabla de notas, responsable, próxima acción) |
| 0012 | Auditoría y llaves (upstream) |
| 0013 | `solicitudes_servicio.proveedores_mostrados` |
| 0014 | Valor `selfie` en `tipo_archivo` (sin uso hoy; se puede ignorar) |
| 0015 | `proveedores.foto_perfil` |
| 0016 | `proveedores.numero_matricula` (solo el número, sin foto) |
| 0017 | `avisos_proveedor` (cola y actividad) y columnas `utm_*` en `proveedores` |

Revisión pendiente: las llaves foráneas a `user` de 0011 son NO ACTION (borrar un admin con casos o notas falla).

## Variables de entorno nuevas
```
ADMIN_NOTIFY_EMAIL=         # correo del fundador (no va en el código)
NOTIFY_PROVIDER_EVENTS=true # false apaga los correos; la vista de actividad sigue registrando
NOTIFY_WINDOW_MINUTES=5     # ventana de agrupación de cambios
NOTIFY_FROM="LasTresB <notificaciones@lastresb.com.co>"
NOTIFY_DRY_RUN=false        # true: el correo sale en consola y no se envía
CRON_SECRET=                # protege /api/cron/avisos
NEXT_PUBLIC_WHATSAPP_AYUDA= # botón «Necesito que un asesor me ayude» (build time)
RESEND_API_KEY=             # ya existía; sin ella los correos solo salen en consola
```

## Proceso programado
Cada minuto: `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://lastresb.com.co/api/cron/avisos` (cron del VPS o n8n).

## DNS (Resend)
Los valores exactos salen de Resend > Domains. SPF (TXT en el subdominio de envío, con `amazonses.com`) y MX de rebotes, DKIM (`resend._domainkey`) y DMARC (`_dmarc`, empezar en `p=none`).

## Qué cambió (resumen)
- Buscador del inicio con sugerencias, categorías desplegables y sin localidad por defecto.
- Categoría nueva Mecánica y talleres (7 oficios) y 9 oficios nuevos; Veterinarios y Fisioterapia con aviso reforzado y casilla en «Publicar».
- Matrícula: solo el número. Términos de proveedores 1.3 y de clientes 1.2.
- Alta: nombre, WhatsApp y correo primero; autoguardado del borrador (`/api/v1/yo/borrador`).
- Avisos de actividad por correo y vista `/admin/actividad`; UTM del primer ingreso (cookie `las3b_origen`).
- Vista previa (Open Graph) de `/ingreso` y SEO de secciones.

## Pendiente
Revisión de un abogado de `/terminos` y `/privacidad` (incluye foto y selfie como datos sensibles y el aviso de salud); prueba de correo en Gmail y Outlook; prueba de punta a punta con un proveedor real; la página pública del proveedor la construye el ingeniero aparte.
