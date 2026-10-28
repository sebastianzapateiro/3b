# Plan de trabajo (backlog para agentes)

Orden sugerido de construcción. **La siguiente tarea es la primera con `[ ]`.** Al terminar una: marca `[x]`, agrega la fecha y actualiza **Estado** en `AGENTS.md`.

Cada tarea dice qué construir, dónde, con qué mockup y cómo saber que está lista. Las reglas numeradas ("regla 6") son las de `AGENTS.md`.

Definición de terminado para todas: `pnpm typecheck` y `pnpm build` pasan, la pantalla se ve como su mockup en móvil (375 px) y escritorio (1280 px), no se exponen datos privados y hay un commit en español.

---

## [ ] 1. Extensiones y permisos en base (prerrequisito de P2)

- Migración SQL manual nueva en `packages/db/drizzle/` (registrarla en `meta/_journal.json` como hacen las existentes, o generarla con `pnpm --filter @las3b/db exec drizzle-kit generate --custom --name=extensiones`).
- Contenido: `create extension if not exists unaccent;` `create extension if not exists pg_trgm;` función inmutable `f_unaccent(text)` para poder indexar; índices GIN trigram sobre `categorias.nombre`, `terminos_busqueda.termino`, `proveedores.nombre_publico`.
- `revoke update, delete on auditoria from` los roles de la app (`authenticated`, `anon` y el usuario de `DATABASE_URL`) (regla 3, CU-78).
- **Aceptación:** `pnpm db:migrate` aplica sin error; `select f_unaccent('Plomería')` devuelve `Plomeria`; un `update auditoria ...` con el usuario de la app falla.

## [ ] 2. P2 Búsqueda `/buscar?q=&localidad=&categoria=`

- Lógica: `apps/web/src/lib/busqueda.ts` → `buscarProveedores({ q, localidad, categoria, pagina })`. Reutilizable por `/api/v1/proveedores` (regla 7).
- Pasos: normalizar `q` (minúsculas, sin tildes) → resolver categorías por `terminos_busqueda` y `categorias.nombre` (similitud trigram, tolera errores) → filtrar proveedores `aprobado`/`en_revision` (regla 6) → ordenar por **coincidencia → cubre la localidad → `promedio`** (CU-01) → paginar (tamaño en `configuracion`, clave `busqueda.tamano_pagina`).
- Barrio → localidad usando `barrios` si `q` o `localidad` coinciden con un barrio (Propuesta: dejarlo activable por `configuracion`).
- Página: `apps/web/src/app/buscar/page.tsx` (Server Component, lee `searchParams`). Mockups `Resultados_web.dc.html` y `Resultados_movil.dc.html`: filtros de categoría y localidad, conteo, tarjetas (reusar `components/TarjetaProveedor.tsx`), estado vacío con sugerencias.
- Conectar el formulario de la home (`app/page.tsx`) para que envíe a `/buscar`.
- Ruta API: `apps/web/src/app/api/v1/proveedores/route.ts` (GET, mismos parámetros, JSON sin datos privados, regla 1).
- SEO: `noindex` en resultados con `q` libre; título "Plomeros en Suba" cuando hay categoría + localidad.
- **Aceptación:** "plomeria", "plomería" y "plomero" dan los mismos resultados; "plomreo" sugiere/encuentra Plomería; proveedores `pausado` no aparecen; con localidad, los que la cubren salen primero.

## [ ] 3. P7 Portafolio `/[slug]` con diseño completo

- Ya hecho: resolución en `lib/portafolio.ts` (301, no disponible, 404) y metadatos.
- Falta: extender `obtenerPortafolio` con servicios y precios (`servicios_proveedor`), fotos visibles (`portafolio_fotos` con `estado = visible`), insignias, horario, formas de pago, factura/garantía, años de experiencia, últimas reseñas con respuesta. **Nunca** columnas privadas (regla 1).
- UI según `Perfil_web.dc.html` y `Perfil_movil.dc.html`. Botón verde "Escribir por WhatsApp" que apunta a `/api/v1/contactos?...` (tarea 4).
- Imagen Open Graph por proveedor: `app/[slug]/opengraph-image.tsx` usando `lib/og.tsx`.
- Quitar el atajo de `RECOMENDADOS_DEMO` cuando haya proveedores reales en la base.
- **Aceptación:** un proveedor `aprobado` muestra todo el mockup; `pausado` muestra "no disponible"; `suspendido` da 404; slug viejo redirige 301.

## [ ] 4. P4 Contacto `/api/v1/contactos`

- Lógica: `lib/contacto.ts` → `registrarContacto({ proveedorSlug, categoriaId?, localidadId?, origen, sesion?, anonimoId? })` inserta en `contactos` y devuelve el enlace de `enlaceWhatsApp` (`@las3b/shared`).
- Ruta GET que registra y responde 302 a `wa.me`. Anónimo: cookie `anonimo_id` (uuid, httpOnly, 1 año).
- Solo proveedores `aprobado`/`en_revision`; si no, 404.
- Limitar clics repetidos (mismo visitante + proveedor en N minutos, N en `configuracion`) para no inflar métricas.
- **Aceptación:** cada clic crea una fila en `contactos` con `origen`; el mensaje de WhatsApp lleva categoría y localidad.

## [ ] 5. P1 Pendientes de cuenta

- Proveedor de correo en `lib/correo.ts` (Resend recomendado; variable `RESEND_API_KEY` en `.env.example`). Mantener el log en consola si falta la clave.
- Primer ingreso con Google: si el usuario no tiene consentimiento vigente, redirigir a una pantalla que pida mayoría de edad + aceptación (regla 5) antes de continuar.
- Textos reales de políticas desde Drive (carpeta "Textos legales") en `politicas`; hoy la versión es `0.1-borrador`.
- **Aceptación:** registro envía correo real; un usuario Google nuevo no puede navegar sin aceptar.

## [ ] 6. P3 Alta de proveedor `/proveedores/registro` (3 pasos)

- Mockups `Proveedor_paso1/2/3.dc.html` (móvil; escritorio = misma estructura centrada).
- Paso 1 datos básicos y segmento (preguntas iniciales → `segmento`); paso 2 qué ofreces (categorías, servicios y precios) y dónde (localidades); paso 3 verificación: OTP por WhatsApp (5 min, 3 intentos, bloqueo 15 min), documento, dirección de notificaciones.
- Reglas en `docs/02-casos-de-uso.md` §Alta: requisitos por segmento, `exige_rut_desde_alta`, `exige_matricula`, RUT diferido 30 días (`rut_fecha_limite`, plazo en `configuracion`).
- Archivos: JPG/PNG/HEIC/PDF ≤ 10 MB, validar tipo real, nombre aleatorio en bucket `privado` de Supabase Storage (regla 2). El documento se guarda cifrado en `documento_cifrado`.
- Estado: guarda como `borrador` en cada paso; al enviar pasa a `pendiente`. Slug propuesto con `slugSchema`.
- **Aceptación:** se puede retomar un borrador; nada privado aparece en `/[slug]`; el proveedor queda en la cola del backoffice.

## [ ] 7. Backoffice: acceso y cola de aprobación (B1)

- Proteger `/admin/*` (middleware o layout de servidor): sesión + rol en `usuario_roles` (`verificador`, `moderador`, `admin`) + 2FA TOTP activo; sesión de 8 h. Ingreso en `/admin/ingresar` (`BO_Ingreso.dc.html`).
- `/admin` tablero (`BO_Tablero`), `/admin/aprobaciones` cola (`BO_Aprobaciones`), `/admin/proveedores/[id]` revisión con documentos por URL firmada de 5 min y registro en `auditoria` (`BO_Revision`), `/admin/proveedores/nuevo` alta asistida (`BO_NuevoProveedor`).
- Toda decisión (aprobar, rechazar con motivo, pedir corrección, insignias) inserta en `auditoria`.
- Motivos de rechazo y sub-roles son **Propuesta** pendiente de Andrés: hacerlos configurables.
- **Aceptación:** sin 2FA no entra; aprobar cambia el estado a `aprobado`, fija `aprobado_en` y el perfil aparece en búsqueda.

## [ ] 8. Páginas legales `/terminos`, `/privacidad`, `/reclamos`

- Textos de Drive (carpeta "Textos legales"), versión vigente desde `politicas`. Ver `docs/04-legal.md`.
- `/reclamos`: formulario público que crea fila en `reclamos` con `fecha_limite` en días hábiles (usar `festivos`, plazos en `configuracion`, CU-92).
- Enlazar desde el pie de página.

## Después del MVP base (sin orden)

- P5 reseñas (CU-20, regla 4) y respuesta única del proveedor (CU-45); "Llegué" y código de servicio (CU-38).
- P8 estadísticas del proveedor y panel del proveedor (mockup pendiente).
- B2–B8 restantes según mockups `BO_Moderacion`, `BO_Usuarios`, `BO_Catalogo`, `BO_Cumplimiento`, `BO_Auditoria`.
- Regla de reputación → `en_revision` (CU-01/estados), automatizaciones en n8n.
- App Expo (fase 2), consumiendo solo `/api/v1`.
