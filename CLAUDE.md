# Las 3B — guía para agentes

Directorio de servicios y oficios en Bogotá: el comprador busca por servicio y localidad y contacta al proveedor directo por WhatsApp. Gratis, sin comisiones. Las 3B es un **portal de contacto**, no intermediario de pagos ni garante del servicio.

Lee `docs/` antes de cambiar reglas de negocio. Fuente de verdad: Drive del proyecto (enlace en `docs/README.md`).

## Stack

- Monorepo **pnpm + Turborepo**, Node 22.
- `apps/web`: **Next.js 16** (App Router, TypeScript, Tailwind 4). Público + `/admin` + `/api/v1` + `/api/auth`.
- `packages/db`: **Drizzle ORM** sobre Postgres (**Supabase**), `casing: "snake_case"`.
- Auth: **Better Auth** (correo, Google, 2FA TOTP para backoffice). Config en `apps/web/src/lib/auth.ts`.
- `packages/shared`: marca, localidades, reglas de slug, WhatsApp. Úsalo desde web y, en fase 2, desde Expo.
- `apps/mobile`: reservado para Expo (fase 2).

## Comandos

```bash
pnpm install
pnpm dev                 # web en http://localhost:3000
pnpm typecheck
pnpm build
pnpm db:generate         # nueva migración tras cambiar el esquema
pnpm db:migrate          # aplica migraciones a DATABASE_URL
pnpm db:seed             # localidades, insignias, taxonomía
```

## Reglas que no se rompen

1. **Datos privados nunca en público:** documento, dirección de notificaciones, RUT y archivos de `documentos` no se exponen en el portafolio ni en la API pública.
2. **Archivos privados** solo por URL firmada de 5 min desde el servidor, y cada apertura se registra en `auditoria`.
3. **`auditoria` es solo inserción.** Nunca UPDATE ni DELETE.
4. **Una reseña por contacto** y solo con un clic de contacto previo.
5. **Consentimientos** con casilla no premarcada; guardar versión de política, fecha e IP.
6. **Solo proveedores `aprobado` o `en_revision`** aparecen en búsqueda; `pausado` muestra "no disponible"; `suspendido` y `rechazado` dan 404.
7. Lógica de negocio en funciones de servidor reutilizables; `/api/v1` y Server Actions solo las llaman (la app móvil no puede usar Server Actions).
8. Plazos, límites y días configurables viven en `configuracion`, no en constantes.
9. Copia en español de Colombia, tono de vecino, botones con verbo concreto.

## Convenciones

- Nombres de dominio en español (`proveedores`, `resenas`), código en TypeScript estricto.
- Colores y tipografía: tokens de `apps/web/src/app/globals.css` (ver `docs/05-marca.md`). Verde solo para acción de contacto/éxito; botones neutros en tinta.
- Slugs: validar con `slugSchema` de `@las3b/shared`.
