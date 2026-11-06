/**
 * P2 / CU-03 · Mosaico de /categorias: un tile por categoría y, en Hogar, uno por cada subgrupo.
 * Los conteos y los 3 oficios de cada tile salen de la taxonomía (`CATEGORIAS`, la misma que alimenta la semilla),
 * nunca de texto escrito a mano. Colores, fotos y disposición viven aquí, tipados, no en el JSX.
 */
import { sugerirSlug, type CategoriaPadre } from "@las3b/shared";

export type Tema = {
  /** Degradado de respaldo en diagonal de 135° (cuando no hay foto). */
  desde: string;
  hasta: string;
  /** Foto de public/ (banco de imágenes, ver public/fotos/CREDITOS.md). Con foto el texto siempre es blanco sobre el velo. */
  foto?: { src: string; alt: string };
  /** Color del texto sobre el degradado de respaldo. Blanco sobre amarillo no cumple AA: Clases usa tinta. */
  textoSinFoto: "blanco" | "tinta";
  /** Color de la píldora «Ver todo» sobre blanco (≥ 4,5:1). */
  pildora: string;
};

export type ClaveTile = string;

export const TEMAS: Record<ClaveTile, Tema> = {
  reparaciones: { desde: "#0F6B5C", hasta: "#6FB5A5", foto: { src: "/fotos/hogar.jpg", alt: "Manos de un técnico instalando una cerradura con un taladro" }, textoSinFoto: "blanco", pildora: "#0F6B5C" },
  "obra-y-acabados": { desde: "#0A4F44", hasta: "#3E9C88", foto: { src: "/fotos/nosotros.jpg", alt: "Dos maestros cortando madera dentro de una casa en remodelación" }, textoSinFoto: "blanco", pildora: "#0A4F44" },
  instalaciones: { desde: "#2C8A78", hasta: "#8CCBBB", foto: { src: "/fotos/instalaciones.jpg", alt: "Técnico instalando un equipo de aire acondicionado en una terraza" }, textoSinFoto: "blanco", pildora: "#1F6B5B" },
  "limpieza-y-jardin": { desde: "#3E7D32", hasta: "#9CCB86", foto: { src: "/fotos/limpieza.jpg", alt: "Rincón de una cocina con la mesa llena de cosas por ordenar y limpiar" }, textoSinFoto: "blanco", pildora: "#3E7D32" },
  "clases-y-refuerzo": { desde: "#C99400", hasta: "#F8D970", foto: { src: "/fotos/clases.jpg", alt: "Un profesor y un estudiante en una clase" }, textoSinFoto: "tinta", pildora: "#6B4E00" },
  "acarreos-y-transporte": { desde: "#C2452D", hasta: "#E58C78", foto: { src: "/fotos/acarreos.jpg", alt: "Habitación vacía con escombros en el piso, lista para vaciar o remodelar" }, textoSinFoto: "blanco", pildora: "#C2452D" },
  "servicios-varios": { desde: "#4B4636", hasta: "#A99A78", foto: { src: "/fotos/servicios-varios.jpg", alt: "Dos personas arreglando plantas en una canasta" }, textoSinFoto: "blanco", pildora: "#4B4636" },
  "mascotas-y-veterinaria": { desde: "#6B4E00", hasta: "#D9A62E", foto: { src: "/fotos/mascotas.jpg", alt: "Dos personas trabajando juntas dentro de una casa" }, textoSinFoto: "blanco", pildora: "#6B4E00" },
  "servicios-profesionales": { desde: "#1B2623", hasta: "#5C6B66", foto: { src: "/fotos/profesionales.jpg", alt: "Hombre trabajando con un portátil y una tableta en su sala" }, textoSinFoto: "blanco", pildora: "#1B2623" },
  "mecanica-y-talleres": { desde: "#2E3A59", hasta: "#7C8DB5", foto: { src: "/fotos/mecanica.jpg", alt: "Mano de un técnico con un destornillador revisando un tomacorriente" }, textoSinFoto: "blanco", pildora: "#2E3A59" },
};

/** Si aparece una categoría nueva sin tema, se ve con este degradado neutro hasta que se le asigne uno. */
export const TEMA_RESPALDO: Tema = { desde: "#1B2623", hasta: "#5C6B66", textoSinFoto: "blanco", pildora: "#1B2623" };

/**
 * Velo oscuro inferior detrás del texto (también sobre los degradados), en px desde el borde de abajo:
 * garantiza contraste AA (4,5:1) del texto blanco aun sobre el extremo más claro de cada degradado.
 */
export const VELO = { opacidadBase: 0.78, opacidadTexto: 0.58, altoTexto: 150, altoTotal: 260, rgb: "10, 15, 14" } as const;

/** Columnas del tile en escritorio (grid de 12) y fila en la que va. */
type Disposicion = { columnas: 6 | 3; fila: 1 | 2 | 3 };
const DISPOSICION: Record<ClaveTile, Disposicion> = {
  reparaciones: { columnas: 6, fila: 1 },
  "obra-y-acabados": { columnas: 3, fila: 1 },
  instalaciones: { columnas: 3, fila: 1 },
  "mascotas-y-veterinaria": { columnas: 6, fila: 3 },
  "servicios-profesionales": { columnas: 3, fila: 3 },
  "mecanica-y-talleres": { columnas: 3, fila: 3 },
};
const DISPOSICION_BASE: Disposicion = { columnas: 3, fila: 2 };

export type TileMosaico = {
  clave: ClaveTile;
  /** «Hogar» en los tiles de sus subgrupos; null en las demás categorías. */
  etiqueta: string | null;
  nombre: string;
  /** Los 3 primeros oficios en el orden de la taxonomía. */
  oficios: string[];
  total: number;
  href: string;
  icono: CategoriaPadre["icono"];
  tema: Tema;
  disposicion: Disposicion;
};

export const etiquetaAccesible = (t: Pick<TileMosaico, "etiqueta" | "nombre" | "total">) =>
  `${t.etiqueta ? `${t.etiqueta} · ` : ""}${t.nombre}, ${t.total} oficios`;

/** Un tile por categoría; las que tienen subgrupos (Hogar) se parten en un tile por subgrupo. */
export function construirMosaico(categorias: CategoriaPadre[]): TileMosaico[] {
  const tiles: TileMosaico[] = [];
  const agregar = (clave: ClaveTile, etiqueta: string | null, nombre: string, href: string, padre: CategoriaPadre, subs: CategoriaPadre["subcategorias"]) => {
    tiles.push({
      clave,
      etiqueta,
      nombre,
      oficios: subs.slice(0, 3).map((s) => s.nombre),
      total: subs.length,
      href,
      icono: padre.icono,
      tema: TEMAS[clave] ?? TEMA_RESPALDO,
      disposicion: DISPOSICION[clave] ?? DISPOSICION_BASE,
    });
  };
  for (const c of categorias) {
    const grupos = [...new Set(c.subcategorias.map((s) => s.subgrupo).filter((g): g is string => Boolean(g)))];
    if (grupos.length === 0) {
      agregar(c.slug, null, c.nombre, `/categorias/${c.slug}`, c, c.subcategorias);
      continue;
    }
    for (const g of grupos) {
      const clave = sugerirSlug(g);
      agregar(clave, c.nombre, g, `/categorias/${c.slug}#${clave}`, c, c.subcategorias.filter((s) => s.subgrupo === g));
    }
  }
  return tiles;
}
