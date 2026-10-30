# Dudas abiertas para el ingeniero (Sebastián)

Actualizado el 30 oct 2026. Lo que el dueño ya decidió está en el código y en `docs/02-casos-de-uso.md`; aquí queda lo que necesita tu criterio.

## 1. Orden de los proveedores por «nivel del perfil» (P2, P3, B7)

El dueño pidió ordenar por nivel del perfil (verificado, completo, destacado) mientras no haya reseñas y pasar gradualmente a las reseñas verificadas (peso `n / (n + 5)`, estrellas desde 3 reseñas verificadas, rotación diaria dentro de un nivel, página `/como-ordenamos`, vista en B7). **No está construido.** Lo ya acordado con el dueño:

- Los datos de ejemplo del inicio (proveedores y reseña destacada de `lib/demo.ts`) se quedan como muestra y se reemplazan por reales a medida que lleguen proveedores.
- Se instaló vitest (`pnpm test`) para las pruebas que pide el encargo (por ejemplo, que el RUT no cambie el puntaje).
- El «porcentaje de completitud» de `lib/completitud.ts` es una herramienta interna del equipo; el nivel público lo reemplaza en la interfaz.

Lo que falta decidir:

1. **Foto de perfil, horario y fotos de trabajos.** No existe la foto de perfil, `proveedores.horario` no tiene pantalla y las fotos de trabajos (`portafolio_fotos`) no tienen carga. Sin eso nadie puede pasar de «Perfil verificado». ¿Se construyen dentro de esta tarea?
2. **Qué cuenta como reseña verificada.** Hoy `resenas.verificada` se marca al crear la reseña si el contacto tiene código de servicio (flujo «Servicio prestado», abajo). La reseña sin código sigue permitida (cualquier contacto previo). ¿Se deja así o solo se permite calificar con código?
3. **Proceso nocturno.** Propuesta: Vercel Cron diario con una ruta protegida por un secreto (`CRON_SECRET`). Alternativa: n8n.
4. **Selector de orden.** Hoy dice «Mejor calificados» (`lib/filtros.ts`, `/buscar`); el encargo pide «Relevancia» como valor por defecto.
5. **JSON-LD y estrellas.** `jsonLdProveedor` publica `aggregateRating` con cualquier número de reseñas; el encargo pide 3 o más verificadas, y nunca en los listados.

## 2. Slug del proveedor

El dueño dejó el slug en tus manos. Hoy lo escribe el proveedor en el paso 3 del registro (`slugSchema`, sin sufijo automático). El encargo original proponía `{nombre}-{oficio}`, único con sufijo numérico y editable solo por el administrador, con lista de reservados (ya cubierta por `SLUGS_RESERVADOS`). **El dueño pidió que se le recuerde confirmar si lo ajustaste.**

## 3. Calificación después del servicio (CU-38 ajustado)

Construido el 30 oct 2026:

- El proveedor pulsa «Servicio prestado» en `/panel/contactos`. Se crea el código en `servicios` y se pide al cliente que califique con `/{slug}/calificar?codigo=XXXXXX`.
- Con cuenta y correo real, sale por correo en el acto. Sin cuenta (viene del buscador del inicio), queda en «Calificaciones por enviar» de `/admin/solicitudes` y el administrador lo manda por WhatsApp a mano. **Pendiente: automatizar con la API de WhatsApp (de pago) y con el OTP real.**
- El cliente debe ingresar (crear cuenta) para calificar; el enlace conserva el código.
- Falta mostrar la etiqueta «Servicio verificado» en la reseña (`resenas.verificada` ya se guarda).
- Solo se puede marcar «Servicio prestado» sobre contactos propios; no hay límite ni alerta contra marcarlo sin haber prestado el servicio (riesgo de reseñas infladas por el propio proveedor: conviene revisarlo en B7).

## 4. Buscador del inicio y solicitudes

- `GOOGLE_MAPS_API_KEY` es opcional: sin ella la dirección escrita se guarda pero no ordena por cercanía (solo «Usar mi ubicación actual»). La cercanía se mide al centro de cada localidad del proveedor.
- Los límites contra abuso (6 por IP y 4 por número cada hora) están en `lib/solicitudes.ts`; no hay verificación por código.
