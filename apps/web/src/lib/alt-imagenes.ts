/**
 * SEO / accesibilidad · Texto alternativo de las imágenes que sí informan (RNF-03).
 * - Foto de perfil junto al nombre en una tarjeta: ALT vacío (el nombre ya está al lado; repetirlo es ruido).
 * - Foto de trabajo: la descripción del proveedor si la escribió; si no, qué es y cuál es, sin repetir su nombre ni inventar lo que muestra.
 * - Foto de categoría: la descripción de lo que realmente muestra la foto (lib/mosaico.ts).
 */
export function altFotoTrabajo(foto: { descripcion?: string | null }, oficio?: string | null, posicion?: number, total?: number): string {
  const propio = foto.descripcion?.trim();
  if (propio) return propio;
  return `Foto de un trabajo${oficio ? ` de ${oficio.toLowerCase()}` : ""}${posicion && total && total > 1 ? ` (${posicion} de ${total})` : ""}`;
}
