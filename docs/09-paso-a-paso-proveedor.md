# Paso a paso del proveedor: de la inscripción al envío a revisión

Recorrido del proveedor tal como está construido (CU-30). Entrada: <https://www.lastresb.com.co/proveedores/registro>
o «Soy proveedor» en `/ingreso`. Sirve para probar el alta, explicarla al equipo y acompañar por WhatsApp a quien se pierde.

Código: `app/ingreso/`, `app/proveedores/registro/route.ts`, `lib/alta-proveedor.ts`, `lib/documentos.ts`, `app/panel/`.

## Lista de chequeo del proveedor

Para acompañar a un proveedor o probar el alta de punta a punta. El detalle de cada paso está en las etapas de abajo.

**Inscripción**
- [ ] Eligió «Soy proveedor» en `/ingreso`
- [ ] Creó la cuenta con Google («Sí, crear mi cuenta») o con correo y clave
- [ ] Si usó correo: confirmó el enlace que le llegó e ingresó
- [ ] Llegó a `/panel` con la bienvenida

**Datos del perfil (obligatorios)**
- [ ] Datos del negocio: nombre, WhatsApp, tipo (sin RUT, con RUT o empresa), de 1 a 3 oficios y dirección de la página
- [ ] Localidades donde trabaja
- [ ] Al menos un servicio con «precio desde»
- [ ] Datos de identidad: documento, dirección de notificaciones y fecha de nacimiento
- [ ] Documento de identidad por las dos caras
- [ ] RUT, si es *con RUT*, *empresa* o su oficio lo exige
- [ ] Cámara de comercio, si es empresa
- [ ] Matrícula o certificación, si su oficio la exige

**Recomendados**
- [ ] Fotos de sus trabajos
- [ ] «Sobre mí»

**Envío**
- [ ] Marcó las casillas en `/panel/confirmar` (términos, datos personales, servicios no permitidos y, si trabaja con menores, Ley 1918)
- [ ] Tocó «Enviar a revisión» y el panel dice «En revisión del equipo»

**Después de aprobado**
- [ ] Su perfil sale en la búsqueda
- [ ] Si es *sin RUT*: cargó el RUT dentro de los 30 días

## Etapa 1 · Inscripción (`/ingreso`)

1. **Elige «Soy proveedor».** El tipo se guarda en una cookie (`l3b_tipo`, 1 hora) para que sobreviva al ir y volver de Google.
   Si entró por `/proveedores/registro` sin sesión, el sitio lo manda a `/ingreso` y lo trae de vuelta al terminar.
2. **Crea la cuenta**, con una de dos opciones:
   - **Google:** autoriza en Google y vuelve a `/ingreso/listo`, que muestra «¿Quieres crear tu cuenta de proveedor con estos
     datos?». Marca la casilla (mayor de edad, términos para proveedores y política de datos) y toca **«Sí, crear mi cuenta»**.
   - **Correo:** nombre, correo y clave, más dos casillas sin premarcar (mayor de edad y políticas).
3. **Solo con correo:** abre el enlace de confirmación que le llega. Vuelve a `/ingreso` con «Tu correo quedó confirmado»
   e ingresa con su clave. Sin confirmar el correo no puede entrar.

En los dos casos se guardan los consentimientos con versión, fecha e IP (regla 5).

## Etapa 2 · Borrador y entrada al panel (automático)

4. Se crea el **borrador** del proveedor con el nombre de la cuenta y una dirección sugerida
   (ej. `lastresb.com.co/jairo-perez`). No sale en la búsqueda.
5. Entra a **`/panel?bienvenida=1`**. El Resumen muestra las tareas, el porcentaje de avance y la siguiente tarea pendiente.
   Cada vez que guarda una tarea, el panel lo lleva a la siguiente.

Una cuenta que ya era de cliente y elige «proveedor» ve primero «Activa también tu perfil de proveedor».

## Etapa 3 · Datos del perfil

| # | Tarea | Pantalla | Qué llena | ¿Obligatoria? |
|---|---|---|---|---|
| 6 | Datos de tu negocio | `/panel/perfil#negocio` | Nombre público, WhatsApp, tipo (independiente sin RUT, con RUT o empresa), de 1 a 3 oficios y dirección de la página | Sí |
| 7 | Dónde trabajas | `/panel/perfil#localidades` | Localidades de Bogotá donde atiende | Sí |
| 8 | Tus servicios | `/panel/servicios` | Al menos un servicio con «precio desde» | Sí |
| 9 | Datos de identidad | `/panel/verificacion#identidad` | Tipo y número de documento (cifrado), dirección de notificaciones, fecha de nacimiento. **Privados** (regla 1) | Sí |
| 10 | Fotos de documentos | `/panel/verificacion#documentos` | Los documentos de la tabla siguiente | Sí |
| — | Fotos de trabajos | `/panel/fotos` | Fotos de trabajos hechos | No, recomendada |
| — | Sobre mí | `/panel/perfil#sobre` | Cómo trabaja | No, recomendada |

### Documentos según el tipo y el oficio

| Documento | Cuándo se pide |
|---|---|
| Documento de identidad, frente y reverso | Siempre |
| RUT | Antes de enviar si es *con RUT*, *empresa* o su oficio lo exige. *Sin RUT*: 30 días después de la aprobación (si no, `pausado_por_rut`) |
| Cámara de comercio | Empresa |
| Matrícula o certificación del oficio | Oficios que la exigen |
| Autorización Ley 1918 | Oficios con menores: se firma con casilla al enviar; el escaneado en papel es opcional |

Formatos: JPG, PNG, HEIC o PDF. Van al bucket `privado`, se valida el tipo real del archivo y solo el equipo los abre,
con URL firmada y registro en `auditoria` (regla 2).

## Etapa 4 · Enviar a revisión (`/panel/confirmar`)

11. Revisa el resumen. **«Enviar a revisión»** se activa cuando no falta ninguna tarea obligatoria.
12. Marca las casillas, sin premarcar:
    - Términos de uso para proveedores.
    - Tratamiento de datos personales para verificar identidad.
    - Declaración de que no ofrece transporte de personas ni servicios de salud o cuidado de personas.
    - Autorización de la Ley 1918, solo si su oficio trabaja con menores.
13. El perfil pasa a **`pendiente`**, se registran los consentimientos y le llega el aviso de registro recibido.
    Desde ahí ya no puede cambiar nombre, oficios ni dirección: tiene que escribir al equipo.

## Después: lo que hace el equipo

14. El verificador revisa en `/admin/aprobaciones`: identidad y edad con la cédula (menor de edad → rechazo) y los documentos.
15. **Aprobado:** el perfil se publica en la búsqueda. **Rechazado:** el panel muestra «Necesita correcciones».

Estados: `borrador → pendiente → aprobado | rechazado` (ver `02-casos-de-uso.md` § Estados del proveedor).

## Pendientes conocidos

- WhatsApp sin verificar: el código (OTP) todavía sale en la consola, no por WhatsApp.
- Ley 1918: el alta la firma con casilla, pero el backoffice la marca «Falta» si no hay archivo.
- La edad se declara con una casilla y se comprueba con la cédula en la revisión.
- Si la persona se demora más de 1 hora entre elegir «proveedor» y terminar con Google, vence la cookie del tipo y la cuenta
  queda como cliente; ve «Activa también tu perfil de proveedor».
