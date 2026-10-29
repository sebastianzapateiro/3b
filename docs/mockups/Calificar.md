# Calificar a un proveedor (`/[slug]/calificar`)

Pantalla nueva. Una columna centrada (máx. 640 px), mismo estilo que Login: título grande, texto de apoyo y una tarjeta con el formulario.

**Quién puede calificar (regla 4):** solo quien dio clic en «Escribir por WhatsApp» desde Las 3B (queda en `contactos`) y aún no ha reseñado ese contacto. Una reseña por contacto. Sin sesión se lleva a `/ingresar` y se regresa aquí. Un clic anónimo se asocia a la cuenta al calificar.

**Estados de la pantalla**
1. *Sin contacto previo:* aviso amarillo «Primero contáctalo» + botón verde «Escribir por WhatsApp».
2. *Ya calificó:* aviso gris.
3. *Perfil propio:* aviso gris.
4. *Formulario:* cuatro criterios con estrellas de 1 a 5 (Puntualidad, Calidad del trabajo, Calidad-precio, Cumplimiento) y comentario opcional de hasta 500 caracteres. Botón «Publicar reseña».
5. *Gracias:* aviso verde con enlaces a las reseñas del perfil y a «Mis reseñas».

La estrella de cada reseña es el promedio de los cuatro criterios; la calificación del proveedor es el promedio de esas reseñas.
