# Panel del proveedor (`/panel`)

Pantalla nueva, diseñada con el mismo lenguaje de Perfil y Home (tarjetas blancas de borde suave, radio 22, títulos Bricolage, botones tinta). Se implementó directamente en `apps/web/src/app/panel`.

**Quién entra:** persona con sesión que ya tiene registro de proveedor. Sin sesión va a `/ingresar`; sin registro, a `/proveedores/registro`.

**Navegación (2 nov 2026):** marco del backoffice. Menú lateral oscuro (barra superior desplazable en móvil) con el anillo de avance del perfil, nombre, dirección y chip de estado; secciones Resumen · Perfil y negocio · Servicios y precios · Verificación · Enviar a revisión (solo en borrador) · Contactos y Reseñas (después de enviar). Cada sección lleva ✓ o el número de pasos pendientes. Sin cabecera ni pie del sitio. Encabezado con nombre público, dirección `lastresb.com.co/<slug>`, chip de estado y «Ver mi página».

**Alta dentro del panel (CU-30):** al elegir «proveedor» se crea el borrador y entra aquí. El Resumen muestra el porcentaje grande, el siguiente paso con «Continuar» y los pasos numerados (negocio, dónde trabajas, servicios, identidad, documentos, «Sobre mí» opcional, enviar). En las demás secciones, una franja amarilla dice el paso que sigue. Al guardar un paso, lleva al siguiente pendiente.

| Pestaña | Contenido |
|---|---|
| Resumen | Avisos (motivo de rechazo, plazo de RUT, en revisión). Tres cifras: te escribieron (30 y 7 días), calificación, reseñas sin responder. Lista «Completa tu perfil» (Sobre mí, servicio, localidades, documentos). Tarjeta «Tu página pública»: ver mi página, pausar/reactivar. |
| Perfil | Sobre mí (280), años de experiencia, localidades, emite factura, ofrece garantía. Categorías y dirección de la página son de solo lectura (cambian con revisión del equipo). |
| Servicios | Lista editable de servicios con detalle, «precio desde» y unidad. Agregar y quitar. |
| Reseñas | Reseñas recibidas con los 4 criterios. Una sola respuesta por reseña, no editable (CU-45). |
| Verificación | Insignias (otorgada/pendiente, vigencia) y documentos cargados. Carga de archivos pendiente del almacenamiento privado. |

Reglas: nunca se muestran documento, dirección de notificaciones ni fecha de nacimiento (regla 1). Pausar solo si el perfil está aprobado.
