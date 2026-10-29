# Mockups Las 3B v0.3

Copia del lienzo "Las 3B — Mockups v0.3" (claude.ai). Cada archivo es una pantalla en HTML con estilos en línea: úsalos como referencia exacta de layout, copia, colores y tamaños al implementar en `apps/web`.

| Archivo | Pantalla | Ruta en la app |
|---|---|---|
| Main.dc.html | Identidad visual: logo, color, tipografía, componentes | — |
| Home_movil / Home_web | Home | `/` |
| Resultados_movil / Resultados_web | Resultados de búsqueda con filtros | `/buscar` |
| Perfil_movil / Perfil_web | Portafolio público del proveedor | `/[slug]` |
| Login_movil | Ingresar | `/ingresar` |
| Proveedor_paso1/2/3 | Alta de proveedor en 3 pasos (móvil): segmento, RUT, matrícula, Ley 1918 | `/proveedores/registro` |
| BO_Ingreso | Backoffice: ingreso con 2FA | `/admin/ingresar` |
| BO_Tablero | Tablero y alertas (B7) | `/admin` |
| BO_Aprobaciones | Cola de aprobación (B1, CU-50) | `/admin/aprobaciones` |
| BO_NuevoProveedor | Registrar proveedor desde el backoffice (alta asistida con invitación) | `/admin/proveedores/nuevo` |
| BO_Revision | Revisión de proveedor, documentos, decisión e insignias (B1, B2) | `/admin/proveedores/[id]` |
| BO_Moderacion | Moderación de contenido (B3) | `/admin/moderacion` |
| BO_Cumplimiento | Reclamos, solicitudes de datos y políticas (B6) | `/admin/cumplimiento` |
| BO_Usuarios | Usuarios, roles y suspensión (B4) | `/admin/usuarios` |
| BO_Catalogo | Categorías y sinónimos (B5) | `/admin/catalogo` |
| BO_Auditoria | Auditoría y parámetros (B8) | `/admin/auditoria` |
| Panel_proveedor.md | Panel del proveedor (descripción, sin lienzo) | `/panel` |
| Calificar.md | Calificar a un proveedor (descripción) | `/[slug]/calificar` |
| Mi_cuenta.md | Mi cuenta y menú de usuario (descripción) | `/cuenta` |

Pendientes en el lienzo: versiones de escritorio de login y del alta de proveedor (usar las móviles como base) y reclamo público.

Backoffice: los motivos de rechazo y la división de sub-roles son propuestas pendientes del visto bueno de Andrés (ver doc "Las 3B — Estado del sistema y decisiones" en Drive).

Notas:
- Los textos entre corchetes (`[Nombre del proveedor]`, `[$ precio]`) son datos de ejemplo que vienen de la base.
- Ignora `<x-dc>`, `<helmet>` y el `<script data-dc-script>`: son del editor de diseño, no del producto.
- Verde `#0F6B5C` solo para contacto/éxito; botones neutros en tinta `#1B2623`.
