# Mockups Las 3B v0.3

Copia del lienzo "Las 3B — Mockups v0.3" (claude.ai). Cada archivo es una pantalla en HTML con estilos en línea: úsalos como referencia exacta de layout, copia, colores y tamaños al implementar en `apps/web`.

| Archivo | Pantalla | Ruta en la app |
|---|---|---|
| Main.dc.html | Identidad visual: logo, color, tipografía, componentes | — |
| Home_movil / Home_web | Home | `/` |
| Resultados_movil / Resultados_web | Resultados de búsqueda con filtros | `/buscar` |
| Perfil_movil / Perfil_web | Portafolio público del proveedor | `/[slug]` |
| Login_movil | Ingresar | `/ingresar` |
| Proveedor_paso1/2/3 | Alta de proveedor en 3 pasos (móvil) | `/proveedores/registro` |

Pendientes en el lienzo: versiones de escritorio de login y del alta de proveedor (usar las móviles como base).

Notas:
- Los textos entre corchetes (`[Nombre del proveedor]`, `[$ precio]`) son datos de ejemplo que vienen de la base.
- Ignora `<x-dc>`, `<helmet>` y el `<script data-dc-script>`: son del editor de diseño, no del producto.
- Verde `#0F6B5C` solo para contacto/éxito; botones neutros en tinta `#1B2623`.
