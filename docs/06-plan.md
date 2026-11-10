# Plan de trabajo (backlog para agentes)

Orden sugerido de construcción. **La siguiente tarea es la primera con `[ ]`.** Al terminar una: marca `[x]`, agrega la fecha y actualiza **Estado** en `AGENTS.md`.

Cada tarea dice qué construir, dónde, con qué mockup y cómo saber que está lista. Las reglas numeradas ("regla 6") son las de `AGENTS.md`.

Definición de terminado para todas: `pnpm typecheck` y `pnpm build` pasan, la pantalla se ve como su mockup en móvil (375 px) y escritorio (1280 px), no se exponen datos privados y hay un commit en español.

---

## [x] 1. Extensiones y permisos en base (prerrequisito de P2)

> **Hecha (1 nov 2026)** en `0010_extensiones_busqueda` (se borró la suelta `0002_busqueda.sql`). Extensiones en el esquema `extensions` y `revoke` condicionado a que existan los roles de Supabase, para que sirva también en un Postgres propio. `lib/busqueda.ts` usa `f_unaccent(lower(...))`, la misma expresión de los índices (verificado con `EXPLAIN`: Bitmap Index Scan). El `update auditoria` con el usuario de la app da «permission denied».


- Migración SQL manual nueva en `packages/db/drizzle/` (registrarla en `meta/_journal.json` como hacen las existentes, o generarla con `pnpm --filter @las3b/db exec drizzle-kit generate --custom --name=extensiones`).
- Contenido: `create extension if not exists unaccent;` `create extension if not exists pg_trgm;` función inmutable `f_unaccent(text)` para poder indexar; índices GIN trigram sobre `categorias.nombre`, `terminos_busqueda.termino`, `proveedores.nombre_publico`.
- `revoke update, delete on auditoria from` los roles de la app (`authenticated`, `anon` y el usuario de `DATABASE_URL`) (regla 3, CU-78).
- **Aceptación:** `pnpm db:migrate` aplica sin error; `select f_unaccent('Plomería')` devuelve `Plomeria`; un `update auditoria ...` con el usuario de la app falla.

## [x] 2. P2 Búsqueda `/buscar?q=&localidad=&categoria=`

> **Hecha (oct 2026)** salvo: falta `GET /api/v1/proveedores` (regla 7, app móvil) y comprobar tolerancia a errores ("plomreo").


- Lógica: `apps/web/src/lib/busqueda.ts` → `buscarProveedores({ q, localidad, categoria, pagina })`. Reutilizable por `/api/v1/proveedores` (regla 7).
- Pasos: normalizar `q` (minúsculas, sin tildes) → resolver categorías por `terminos_busqueda` y `categorias.nombre` (similitud trigram, tolera errores) → filtrar proveedores `aprobado`/`en_revision` (regla 6) → ordenar por **coincidencia → cubre la localidad → `promedio`** (CU-01) → paginar (tamaño en `configuracion`, clave `busqueda.tamano_pagina`).
- Barrio → localidad usando `barrios` si `q` o `localidad` coinciden con un barrio (Propuesta: dejarlo activable por `configuracion`).
- Página: `apps/web/src/app/buscar/page.tsx` (Server Component, lee `searchParams`). Mockups `Resultados_web.dc.html` y `Resultados_movil.dc.html`: filtros de categoría y localidad, conteo, tarjetas (reusar `components/TarjetaProveedor.tsx`), estado vacío con sugerencias.
- Conectar el formulario de la home (`app/page.tsx`) para que envíe a `/buscar`.
- Ruta API: `apps/web/src/app/api/v1/proveedores/route.ts` (GET, mismos parámetros, JSON sin datos privados, regla 1).
- SEO: `noindex` en resultados con `q` libre; título "Plomeros en Suba" cuando hay categoría + localidad.
- **Aceptación:** "plomeria", "plomería" y "plomero" dan los mismos resultados; "plomreo" sugiere/encuentra Plomería; proveedores `pausado` no aparecen; con localidad, los que la cubren salen primero.

## [x] 3. P7 Portafolio `/[slug]` con diseño completo

> **Hecha (oct 2026):** `lib/portafolio-completo.ts`, `components/PerfilProveedor.tsx`, OG por proveedor.


- Ya hecho: resolución en `lib/portafolio.ts` (301, no disponible, 404) y metadatos.
- Falta: extender `obtenerPortafolio` con servicios y precios (`servicios_proveedor`), fotos visibles (`portafolio_fotos` con `estado = visible`), insignias, horario, formas de pago, factura/garantía, años de experiencia, últimas reseñas con respuesta. **Nunca** columnas privadas (regla 1).
- UI según `Perfil_web.dc.html` y `Perfil_movil.dc.html`. Botón verde "Escribir por WhatsApp" que apunta a `/api/v1/contactos?...` (tarea 4).
- Imagen Open Graph por proveedor: `app/[slug]/opengraph-image.tsx` usando `lib/og.tsx`.
- Quitar el atajo de `RECOMENDADOS_DEMO` cuando haya proveedores reales en la base.
- **Aceptación:** un proveedor `aprobado` muestra todo el mockup; `pausado` muestra "no disponible"; `suspendido` da 404; slug viejo redirige 301.

## [x] 4. P4 Contacto `/api/v1/contactos`

> **Hecha (oct 2026)** en `GET /api/v1/contactos/ir?p=<slug>&origen=`. Pendiente: límite de clics repetidos desde `configuracion`; cookie `anonimo_id` a 1 año (hoy 30 días); el `POST /api/v1/contactos` antiguo no valida estado ni reutiliza la cookie (unificar o borrar); `TarjetaProveedor` aún no apunta al endpoint.


- Lógica: `lib/contacto.ts` → `registrarContacto({ proveedorSlug, categoriaId?, localidadId?, origen, sesion?, anonimoId? })` inserta en `contactos` y devuelve el enlace de `enlaceWhatsApp` (`@las3b/shared`).
- Ruta GET que registra y responde 302 a `wa.me`. Anónimo: cookie `anonimo_id` (uuid, httpOnly, 1 año).
- Solo proveedores `aprobado`/`en_revision`; si no, 404.
- Limitar clics repetidos (mismo visitante + proveedor en N minutos, N en `configuracion`) para no inflar métricas.
- **Aceptación:** cada clic crea una fila en `contactos` con `origen`; el mensaje de WhatsApp lleva categoría y localidad.

## [x] 5. P1 Pendientes de cuenta

> **Hecha (oct 2026):** Resend con respaldo en consola; el proxy exige consentimiento (`/consentimiento`) a usuarios sin él. Pendiente: textos legales definitivos desde Drive.


- Proveedor de correo en `lib/correo.ts` (Resend recomendado; variable `RESEND_API_KEY` en `.env.example`). Mantener el log en consola si falta la clave.
- Primer ingreso con Google: si el usuario no tiene consentimiento vigente, redirigir a una pantalla que pida mayoría de edad + aceptación (regla 5) antes de continuar.
- Textos reales de políticas desde Drive (carpeta "Textos legales") en `politicas`; hoy la versión es `0.1-borrador`.
- **Aceptación:** registro envía correo real; un usuario Google nuevo no puede navegar sin aceptar.

## [ ] 6. P3 Alta de proveedor `/proveedores/registro` (dentro del panel)

> **Seguimiento de cambios (5–6 nov 2026).** Lo hecho y lo que queda por aplicar o confirmar:
>
> - **Servicios por oficio (CU-35):** al crear un servicio se elige el oficio y un menú con los servicios que aplican (`serviciosSugeridos`, de los «problemas típicos» de cada oficio en `packages/shared/src/categorias.ts`) más «Otro servicio». Mismo componente en el panel del proveedor y en el alta asistida (`components/panel/SelectorServicio.tsx`). *Pendiente de decidir:* si se quiere una lista de servicios por oficio distinta a los problemas típicos.
> - **Alta asistida (CU-51):** «Qué ofrece y dónde» es un solo componente con estado (`components/admin/OfreceYDonde.tsx`): oficios, localidades en 3 columnas con «Todo Bogotá» primero (marca las 20) y primer servicio según los oficios marcados.
> - **Edición completa por el administrador (B1, 6 nov):** `editarTodoComoAdmin` + sección «Editar todos los datos» en `/admin/proveedores/[id]` (solo rol admin, cualquier estado): nombre legal y público, dirección de la página (la anterior redirige), WhatsApp, correo (la cuenta queda por verificar), presentación, cómo trabaja, documento (cifrado; vacío = no cambiar), nacimiento, dirección, matrícula, oficios (no se quita uno con servicios publicados), localidades y declaraciones. Al proveedor le llega un correo con **qué** cambió, nunca los valores (`perfilEditadoPorEquipo`, `avisarPerfilEditado`); sin correo real se avisa por WhatsApp. Queda en `auditoria` (`perfil_editado_por_equipo`, con los campos). Los verificadores y moderadores conservan el formulario limitado de antes.
> - **Presentación hasta 1000 caracteres (6 nov):** `PRESENTACION_MAX` en `packages/shared/src/whatsapp.ts`; lo usan el panel, el alta asistida, la edición del equipo y el autoguardado (`lib/borrador.ts`). La columna ya era `text`: sin migración.
> - **WhatsApp estándar +57 (6 nov):** todo número se guarda como `+57XXXXXXXXXX` (`normalizarWhatsapp`); los campos muestran el «+57» fijo y se escriben solo los 10 dígitos (`components/CampoWhatsapp.tsx`: registro, panel, alta asistida, edición, contacto al proveedor, aviso de demanda y ayuda). Migración `0019_whatsapp_con_indicativo.sql` (idempotente) deja así los números ya guardados en `proveedores`, `user`, `solicitudes_servicio` y `solicitudes_ayuda_inscripcion`. Migraciones `0019` y `0020` aplicadas el 6 nov 2026 y desplegadas (`main` en `c040fbf`).
> - **Redes sociales del proveedor (P7/P8, 6 nov):** Instagram, Facebook, TikTok, YouTube y sitio web, opcionales. Se escriben como «@usuario» o enlace y se guardan como enlaces https limpios del dominio de esa red (`packages/shared/src/redes.ts`: rechaza otras redes, esquemas raros, usuario/clave en la URL e IP o localhost; con prueba en `lib/redes.test.ts`). Columna `proveedores.redes_sociales` (jsonb, migración `0020`). Las edita el proveedor en `/panel/perfil#redes` (`guardarRedes`) y el administrador en «Editar todos los datos»; se ven en la página pública («Sus redes», enlaces `nofollow ugc` en pestaña aparte) y en los datos estructurados (`sameAs`).
> - **Fotos de trabajos (CU-36, 6 nov):** el proveedor ya las sube en `/panel/fotos` (distintas de los documentos privados); ahora hay una tarjeta en `/panel/perfil` que lleva allí. El equipo también puede subirlas y quitarlas a nombre del proveedor en su ficha (`/api/v1/admin/proveedores/[id]/fotos`, auditadas como `foto_cargada_equipo` y `foto_quitada_equipo`); exige la casilla de que el proveedor confirmó la autoría y autorizó publicarlas. *Pendiente:* confirmar que el bucket `publico` de Storage permite imágenes WebP y lectura pública.
> - **Usuarios y roles (B4, 6 nov):** la lista es una tabla ancha como la de solicitudes (usuario, teléfono, tipo y roles, estado, último ingreso y «Ver perfil» en una sola línea); «Mostrar» es un menú desplegable de filtro. Comprador y Proveedor se deciden por el perfil (no solo por el rol), igual que la columna «Tipo y roles». Los paneles de roles, clave y 2FA quedan debajo de la tabla. La edición de **todos** los datos de un proveedor (con aviso solo de qué cambió) está en su ficha: `Ver perfil` → «Editar todos los datos».
> - **Revisión de SEO (6 nov):** *Ya estaba:* canonical y hreflang en todas las páginas (`meta()`), `noindex` fuera de producción y en cuenta/ingreso/panel/admin, sitemap con proveedores y combinaciones oficio + localidad que cumplen la regla de publicación, `robots.txt`, `llms.txt`, imágenes Open Graph por sección y datos estructurados (Organization, WebSite con buscador, LocalBusiness del proveedor con reseñas, Service, Article, FAQ, breadcrumbs). *Agregado:* título y descripción propios del Home; `/proveedores` (la lista que reemplazó a /buscar y /categorias) con título, descripción, migas e ItemList; `sameAs` con las redes del proveedor y de LasTresB, correo en la organización; `llms.txt` con Proveedores, correo e Instagram; dos guías para los oficios nuevos (mallas de seguridad para el balcón e instalación de cortinas); más búsquedas relacionadas en «Planchado»; y una prueba (`lib/seo-oficios.test.ts`) que protege a todos los oficios: título ≤ 60 caracteres y único, descripción de 120 a 155 y única, palabra principal «en Bogotá», introducción, ≥ 3 búsquedas relacionadas, slugs únicos, sin servicios no permitidos, y que los oficios renombrados conservan su slug. *Falta (no es de código):* enviar `sitemap.xml` en Google Search Console y Bing Webmaster, ficha de Google Business Profile de LasTresB, confirmar `SITIO_INDEXABLE=true` y `NEXT_PUBLIC_SITE_URL` en el VPS (sin ellos el sitio sale con noindex), medir Core Web Vitals en producción y conseguir proveedores aprobados con reseñas (sin ellos no se publican las páginas por oficio y localidad).
> - **Eventos clave de GA4 (9 nov):** dos conversiones, definidas en `lib/analitica-eventos.ts`. **`contacto_proveedor`** (parámetro `origen`): una persona pasa a hablar con un proveedor por WhatsApp; se cuenta al enviar el formulario de `/contactar` o, si ya dejó sus datos (30 días), al pulsar «WhatsApp»; antes de eso solo hay `contacto_intencion` (paso previo, no es conversión). **`registro_proveedor`** (parámetro `metodo`): un proveedor crea su cuenta con correo (el registro con Google todavía no se mide). El contenedor `infra/gtm/contenedor-lastresb.json` ya los reenvía a GA4. *Pendiente en GA4 (a mano):* Administrar → Eventos clave → «Nuevo evento clave» → `contacto_proveedor` y `registro_proveedor`; y publicar la versión nueva del contenedor en Tag Manager.
> - **SEO: indexación por oferta real (10 nov):** regla única en `lib/indexacion.ts`. *Ficha de proveedor:* solo se indexa y entra al sitemap si está **aprobado** (no «en revisión») y con perfil completo (≥ 1 oficio, localidad y servicio visible, y foto de perfil o de trabajos); las demás siguen visibles con `noindex`. *Localidad:* se indexa con ≥ 1 proveedor con ficha indexable (`MIN_PROVEEDORES_LOCALIDAD`); sin oferta la página funciona pero lleva `noindex`, no sale en el sitemap ni en el pie. *Oficios:* se conserva el mínimo `min_proveedores_seo` (3), contado con la misma regla (aprobados y completos) en el sitemap y en la página (antes la página contaba «en revisión» y el sitemap otra cosa). *Sitemap:* dinámico (`force-dynamic`) y guardado 15 min; antes se generaba al compilar, sin base, y salía sin proveedores ni servicios hasta 24 h. *Schema:* la ficha pasa de `LocalBusiness` a `ProfilePage` con `Person` (independiente) u `Organization` (empresa); sin dirección. *Resultados filtrados:* `/proveedores?…` es solo `noindex, follow`, sin canonical (un noindex con canonical hacia otra URL da señales contradictorias). *Robots.txt:* bloquea solo `/admin`, `/api/`, `/panel` y `/cuenta`; las pantallas públicas con `noindex` (ingreso, formularios, calificar) se pueden rastrear para que Google lea esa directiva. *Revisión del 10 nov:* el mínimo de localidad pasó a parámetro `min_proveedores_localidad` (regla 8; 1 por defecto, sin migración); la página de localidad solo muestra los oficios y proveedores que existen en ella (sin oferta: aviso, `noindex`, fuera del sitemap y del pie); el sitemap propaga el error si la base falla (5xx) en vez de salir incompleto con 200; ALT de las tarjetas vacío (el nombre ya está al lado) y de las fotos de trabajos sin el nombre del proveedor; pruebas en `lib/seo-integracion.test.ts` con datos de prueba (no prueban el SQL ni a Google). *Una ficha indexable por proveedor (opción A, 10 nov):* un proveedor con varios oficios tiene una URL `/nombre/oficio` por oficio con el mismo contenido; todas siguen funcionando (sin redirecciones nuevas ni cambio de slugs), pero TODAS declaran como canonical la URL principal (`lib/ficha-seo.ts`, `rutaPrincipalProveedor` en `packages/shared/src/slug.ts`) y solo esa va en el sitemap y en el schema. *Limitación:* no existe un campo de oficio principal; se conserva el criterio provisional del primer oficio alfabético, que puede no ser el más fuerte (Aseo antes que Plomería). *Propuesta aparte, sin implementar:* columna `principal` en `proveedor_categorias` (migración) para que el proveedor o el administrador lo elijan; cambiaría la URL principal de quien elija otro (la anterior seguiría sirviendo, con canonical a la nueva). **Estado (10 nov):** implementación terminada y probada localmente (`pnpm typecheck`, `pnpm test` con 102 pruebas y `pnpm build` pasan; las pruebas usan datos de prueba). **La validación contra la base real está PENDIENTE** por falta de acceso desde el entorno de desarrollo (el túnel SSH y la llave los administra el ingeniero principal). El commit va a revisión; **el merge a `main` y el despliegue quedan condicionados a la aprobación del ingeniero principal**, que debe: (1) abrir el túnel autorizado; (2) ejecutar `FICHA_INDEXABLE_SQL` en solo lectura y comprobar que funciona con el esquema y los registros reales; (3) abrir `/sitemap.xml` con la base conectada y comprobar HTTP 200, XML válido, sin duplicados y URLs coherentes; (4) revisar un proveedor real con varios oficios: la URL principal con canonical propio y las secundarias apuntando a ella; (5) confirmar que las fichas, servicios y localidades del sitemap cumplen las reglas de indexación; (6) confirmar en el servidor `SITIO_INDEXABLE=true` y `NEXT_PUBLIC_SITE_URL=https://www.lastresb.com.co`. Hasta entonces, el SEO NO está validado en producción. *ALT:* fotos de las tarjetas de categoría con su descripción, foto de perfil y de trabajos con el nombre del proveedor. *Pendiente:* revisar a mano los enlaces internos en producción y los ALT de otras imágenes cuando se agreguen fotos.
> - **Dirección de la página:** se genera sola con el nombre público (`clemencia-rojas`, con número si ya existe), al crear la cuenta y en el alta asistida (`SlugSugerido`). La URL pública es `/nombre/oficio` (decisión del dueño, 6 nov). Sin localidad ni oficio dentro del slug. *Confirmar con Sebastián* (el slug es suyo).
> - **/proveedores:** reemplaza a /buscar y /categorias (301). Dos vistas, «Por servicios» (la de entrada) y «Por proveedores» (`?vista=proveedores`); la ubicación exacta fuerza la vista por proveedores. El Home muestra perfiles reales (`lib/destacados.ts`) o los de ejemplo fuera de producción.
> - **Catálogo:** «Instalación de cortinas» y «Instalación de mallas para balcón» (antes «Cortinas y persianas» y «Mallas de seguridad y balcón»), con SEO reforzado; los slugs no cambian. *Pendiente:* `pnpm db:seed`.
> - **Contacto y redes:** Instagram `@lastresb.bogota3` y `contactolastresb@lastresb.com.co` en el pie, Contacto y datos estructurados (`MARCA` en `packages/shared/src/marca.ts`).
> - **Fotos del Home:** las 10 categorías del carrusel tienen foto (`public/fotos`, créditos en `CREDITOS.md`). *Provisionales:* acarreos, mecánica y mascotas (el banco no tiene fotos de esos temas): reemplazar.
> - **Ayuda para proveedores:** botón flotante, panel y solicitudes en `/admin/solicitudes-ayuda`; conteo de clics (`ClicsAnalitica`, `NEXT_PUBLIC_GTM_ID`). Migración `0018` aplicada (5 nov) y Tag Manager `GTM-P3DSRWVH` configurado (6 nov).
> - **Pendientes de producción:** `pnpm db:seed` (nombres nuevos del catálogo; sin confirmar si ya se corrió), perfiles sin perfil de proveedor (botón en `/admin/usuarios`). Migraciones hasta `0020` ya aplicadas (6 nov).
> - **Servicios «Otro servicio»:** se publican al instante (`servicios_proveedor.visible = true`), sin revisión ni marca de que fueron escritos a mano. *Por decidir con el dueño:* revisión previa o cola posterior en `/admin/moderacion` (y desde ahí sumarlos a `serviciosSugeridos`).
> - **Alta asistida (6 nov):** la dirección escrita a mano se normaliza en el servidor (antes salía «Solo minúsculas, números y guiones…» y se perdía el formulario). *Pendiente:* conservar los datos cuando hay un error de validación.
>
> **Cambio (5 nov 2026): registro solo para proveedores, en dos tiempos.** `/ingreso` ya no pregunta «¿Cómo quieres usar LasTresB?»: es el ingreso y registro de proveedores. El registro de cliente solo aparece si se llega a calificar un servicio (`destino` = `/…/calificar`), porque la reseña exige cuenta; los clientes dejan nombre y WhatsApp al contactar al proveedor («Escríbele a …»). **Registro básico:** nombre público, correo, WhatsApp, clave y 1 a 3 oficios (`oficios` viaja en el registro; `lib/auth.ts` lo exige y `crearBorrador` los guarda). Con eso queda creado el perfil (borrador) y lo siguiente es **crear los servicios** (`rutaInicialProveedor` → `/panel/servicios?bienvenida=1`); luego el resto del perfil. Tareas en este orden: contacto, oficios, servicios, cómo trabaja y su página, localidades, identidad, y lo opcional. Mientras falte cualquier paso (opcionales incluidos), el panel de un proveedor ya enviado o publicado muestra la franja «Tu perfil está al N %. Complétalo…». Faltan: ayuda para inscripción (`solicitudes_ayuda_inscripcion`, botón flotante, B7); migración `0018` aplicada el 5 nov 2026.
>
> **Cambio (2 nov 2026):** ya no hay asistente de pasos. `/proveedores/registro` crea el borrador (nombre de la cuenta, dirección automática; `lib/alta-proveedor.ts`) y lleva a `/panel`, donde el Resumen muestra las tareas pendientes con avance: datos del negocio (nombre, WhatsApp, segmento, oficios y dirección, editables solo en borrador, en `/panel/perfil`), localidades, servicios, identidad (en `/panel/verificacion`, documento cifrado), documentos y «Sobre mí» (opcional). `/panel/confirmar` (términos y autorizaciones) sirve para el alta propia y la asistida, y `enviarARevision` exige las tareas obligatorias. Decisión del dueño: entrar «de una» al panel. El OTP falso se quitó del flujo.
>
> **Estado (29 oct 2026):** pasos y borrador hechos. Documento cifrado con AES-256-GCM + huella HMAC (`packages/db/src/cifrado.ts`, clave `DOCUMENTOS_CLAVE`, migración `0004_documento_huella`). Carga de documentos hecha (29 oct): URL firmada de un solo uso → subida directa al bucket `privado` → confirmación con tipo real por firma de bytes (`lib/documentos.ts`, `/api/v1/yo/documentos`); paso 3 exige los obligatorios; el panel permite cargar el RUT diferido. Falta OTP real por WhatsApp (hoy en consola) y antivirus.


- Mockups `Proveedor_paso1/2/3.dc.html` (móvil; escritorio = misma estructura centrada).
- Paso 1 datos básicos y segmento (preguntas iniciales → `segmento`); paso 2 qué ofreces (categorías, servicios y precios) y dónde (localidades); paso 3 verificación: OTP por WhatsApp (5 min, 3 intentos, bloqueo 15 min), documento, dirección de notificaciones.
- Reglas en `docs/02-casos-de-uso.md` §Alta: requisitos por segmento, `exige_rut_desde_alta`, `exige_matricula`, RUT diferido 30 días (`rut_fecha_limite`, plazo en `configuracion`).
- Archivos: JPG/PNG/HEIC/PDF ≤ 10 MB, validar tipo real, nombre aleatorio en bucket `privado` de Supabase Storage (regla 2). El documento se guarda cifrado en `documento_cifrado`.
- Estado: guarda como `borrador` en cada paso; al enviar pasa a `pendiente`. Slug propuesto con `slugSchema`.
- **Aceptación:** se puede retomar un borrador; nada privado aparece en `/[slug]`; el proveedor queda en la cola del backoffice.

## [ ] 7. Backoffice: acceso y cola de aprobación (B1)

> **Alta asistida (29 oct):** «Crear y enviar invitación» (correo + botón de WhatsApp con el mensaje listo, vence en `invitacion_vigencia_h`), panel de invitaciones (esperando / aceptó / venció · reenviar), carga de documentos por el equipo desde la ficha (auditada) y `/panel/confirmar` para que el proveedor revise, acepte términos y envíe a revisión. Pendiente: editar el correo de un borrador sin correo; envío automático por WhatsApp.
>
> **Estado (29 oct 2026):** acceso con rol + 2FA, tablero, aprobaciones, revisión, alta asistida, y además B2–B8 (moderación, usuarios, catálogo, cumplimiento, auditoría). Además: crear usuarios con invitación por correo y QR para el 2FA (29 oct). «Abrir» documento ya usa `/admin/documentos/[id]`: URL firmada (minutos en `configuracion`) y registro en `auditoria` por cada apertura. Sesión del equipo de 8 h, 2FA desde `/ingresar` y códigos de respaldo hechos (29 oct).


- Proteger `/admin/*` (middleware o layout de servidor): sesión + rol en `usuario_roles` (`verificador`, `moderador`, `admin`) + 2FA TOTP activo; sesión de 8 h. Ingreso en `/admin/ingresar` (`BO_Ingreso.dc.html`).
- `/admin` tablero (`BO_Tablero`), `/admin/aprobaciones` cola (`BO_Aprobaciones`), `/admin/proveedores/[id]` revisión con documentos por URL firmada de 5 min y registro en `auditoria` (`BO_Revision`), `/admin/proveedores/nuevo` alta asistida (`BO_NuevoProveedor`).
- Toda decisión (aprobar, rechazar con motivo, pedir corrección, insignias) inserta en `auditoria`.
- Motivos de rechazo y sub-roles son **Propuesta** pendiente de Andrés: hacerlos configurables.
- **Aceptación:** sin 2FA no entra; aprobar cambia el estado a `aprobado`, fija `aprobado_en` y el perfil aparece en búsqueda.

## Cómo funciona (home y `/como-funciona`), 10 nov 2026

Rediseño «Filas y recorrido» (`lib/como-funciona.content.ts`, `ComoFuncionaHome`, `ComoFuncionaPagina`). Trazabilidad verificada: cliente 1–2 → CU-01; cliente 4 → CU-05; proveedor 1–3 → CU-30/CU-32 (alta); cliente 3 y proveedor 4 → portafolio P7; cliente 5 → reseña por contacto previo (P5). No hay un CU propio de «Cómo funciona» en `docs/02`: no se le atribuye ninguno. Pendiente: fotos reales en `public/como-funciona/` (hoy degradado con icono; briefs en TODO del archivo de contenido), QR del proveedor y OTP de WhatsApp (no se prometen en el texto hasta que existan).

## [x] 8. Páginas legales `/terminos`, `/privacidad`, `/reclamos`

> **Hecha (oct 2026):** además `/cookies`, `/terminos-proveedores`, `/resenas`, `/retiro-de-contenido`, `/reportar`. Pendiente: textos definitivos de Drive.


- Textos de Drive (carpeta "Textos legales"), versión vigente desde `politicas`. Ver `docs/04-legal.md`.
- `/reclamos`: formulario público que crea fila en `reclamos` con `fecha_limite` en días hábiles (usar `festivos`, plazos en `configuracion`, CU-92).
- Enlazar desde el pie de página.

## Después del MVP base (sin orden)

- P5 reseñas (CU-20, regla 4) y respuesta única del proveedor (CU-45); "Llegué" y código de servicio (CU-38).
- P8 estadísticas del proveedor y panel del proveedor (mockup pendiente).
- B2–B8 restantes según mockups `BO_Moderacion`, `BO_Usuarios`, `BO_Catalogo`, `BO_Cumplimiento`, `BO_Auditoria`.
- Regla de reputación → `en_revision` (CU-01/estados), automatizaciones en n8n.
- App Expo (fase 2), consumiendo solo `/api/v1`.
