# Casos de uso: reglas que afectan el código

63 casos en Drive (02_Diagramas). Aquí van las reglas de la revisión de Andrés Becerra (22 oct 2026), que prevalecen sobre lo anterior. **Decisión** = se construye así. **Propuesta** = construir como parámetro en `configuracion` (CU-79).

## Búsqueda (CU-01)

- **Decisión:** orden por coincidencia con el servicio → cobertura de la localidad → calificación. Sinónimos agrupados por categoría (`terminos_busqueda`, semillas en `packages/db/src/seed.ts`).
- **Propuesta:** ignora tildes, tolera errores, traduce barrios a localidad (Cedritos → Usaquén), bono a reseñas verificadas e insignia Formalizado.

## Contacto y servicio verificado

- **CU-05:** registrar el clic en `contactos` (anónimo si no hay sesión) y abrir `wa.me` con categoría y localidad.
- **CU-38 (Decisión):** el proveedor marca "Llegué" → se genera código de 6 caracteres en `servicios` y se envía al comprador. La reseña de ese contacto queda "Servicio verificado".
- **CU-29:** el comprador ve sus códigos para usarlos en reclamos.

## Alta del proveedor (CU-30 / CU-32, Decisión)

Preguntas iniciales definen el segmento:

- **Independiente sin RUT:** cédula por ambas caras, correo y WhatsApp verificados, dirección de notificaciones. Publica al ser aprobado y tiene **30 días** para cargar RUT; si no, pasa a `pausado_por_rut`.
- **Independiente con RUT:** lo anterior + RUT.
- **Empresa:** NIT, RUT, certificado de existencia, cédula del representante.
- **Categorías de riesgo alto** (`exige_rut_desde_alta`): RUT obligatorio desde el registro + matrícula si aplica.
- Edad del proveedor: se comprueba con la cédula en la verificación; menor de edad → rechazo.
- **Propuesta técnica:** JPG, PNG, HEIC o PDF hasta 10 MB; validar tipo real, antivirus, nombre aleatorio en bucket privado, URL firmada de 5 min, cada apertura auditada.

## Estados del proveedor

`borrador → pendiente → aprobado | rechazado`; `aprobado ↔ pausado` (proveedor); `aprobado → en_revision → aprobado | suspendido`; `aprobado → pausado_por_rut`. Solo `aprobado` y `en_revision` aparecen en búsqueda.

**Regla de reputación (Decisión):** 2 reseñas con promedio ≤ 2 en 90 días sin respuesta en 5 días → `en_revision`, aviso por correo y 5 días hábiles para su versión. **Propuesta:** solo cuentan reseñas verificadas.

## Reseñas y moderación

- **CU-20:** una reseña por contacto (`resenas.contacto_id` único).
- **CU-45 (Decisión):** una sola respuesta por reseña; el proveedor no la edita ni borra.
- **CU-60/61 (Propuesta):** atención en 48 h; 3 reportes distintos ocultan provisionalmente; nunca se oculta una reseña por ser negativa; apelación una vez.
- **CU-36 (Propuesta):** hasta 20 fotos de 8 MB → WebP 1600 px + miniatura 400 px, sin EXIF/GPS, casilla de autoría.

## Usuarios, cumplimiento y plazos

- **CU-70/71 (Decisión):** antes de suspender, aviso con motivo y 5 días hábiles; suspensión inmediata solo en casos graves.
- **CU-27 (Decisión):** al eliminar cuenta se oculta el perfil, las reseñas quedan anónimas y los datos se conservan bloqueados **5 años**.
- **CU-10 (Decisión):** el reclamante acredita con código o evidencia; se entregan datos del proveedor en 15 días hábiles.
- **CU-92 (Decisión):** consultas de datos 10 días hábiles (+5), reclamos de datos 15 (+8), reclamos de consumo 15. Alertas al 50 %, 80 % y un día antes. Usa `festivos`.
- **CU-76:** cambios importantes de políticas con 15 días de aviso; re-aceptación si son esenciales.
- **CU-78 (Propuesta):** `auditoria` solo admite inserciones.
- **CU-47/54 (Decisión):** autorización Ley 1918 digital o física; insignia "Apto para menores" revalidada cada 6 meses.
