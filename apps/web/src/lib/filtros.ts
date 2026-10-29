/**
 * P2 · Filtros de la búsqueda (CU-01): constantes, textos y lectura de parámetros de la URL.
 * Es código puro (sin base de datos): lo usan el servidor, la API de conteo y el panel de filtros del navegador.
 */
import { TODAS_LAS_SUBCATEGORIAS, categoriaPorSlug } from "@las3b/shared";

export const INSIGNIAS_FILTRO = ["verificado", "formalizado", "certificado", "apto_menores"] as const;
export type InsigniaFiltro = (typeof INSIGNIAS_FILTRO)[number];

export const ORDENES = ["calificacion", "resenas", "precio"] as const;
export type Orden = (typeof ORDENES)[number];

/** Topes del filtro «Precio de la visita» (COP). Para cambiarlos basta editar esta lista: la interfaz se arma sola. */
export const TOPES_VISITA: readonly number[] = [50_000, 100_000, 150_000];

export const ETIQUETA_INSIGNIA: Record<InsigniaFiltro, string> = {
  verificado: "Identidad verificada",
  formalizado: "Con RUT",
  certificado: "Con certificado o curso",
  apto_menores: "Verificado para trabajar con niños",
};

/** Explicación de una línea de cada insignia (ícono «i» del panel). */
export const EXPLICACION_INSIGNIA: Record<InsigniaFiltro, string> = {
  verificado: "Revisamos su documento de identidad y su WhatsApp antes de publicarlo.",
  formalizado: "Tiene su RUT verificado por el equipo.",
  certificado: "Subió una matrícula, certificación o curso de su oficio y el equipo lo revisó.",
  apto_menores: "Presentó la autorización y la verificación de antecedentes de la Ley 1918 para trabajar con niños. Dura 6 meses.",
};

export type CalificacionFiltro = "0" | "4" | "4.5";
/** «convenir» = proveedores que marcaron visita_a_convenir; un número = tope de la visita publicada. */
export type VisitaFiltro = "" | "convenir" | `${number}`;

export const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const etiquetaTope = (tope: number) => `Hasta ${pesos.format(tope)}`;

/** El chip «Verificado para trabajar con niños» solo aplica en Clases y refuerzo y en Recreacionistas. */
export function aplicaNinos(categoria: string | undefined): boolean {
  if (!categoria) return false;
  if (categoria === "clases-y-refuerzo") return true;
  if (categoria === "recreacionistas") return true;
  const oficio = TODAS_LAS_SUBCATEGORIAS.find(({ sub }) => sub.slug === categoria);
  return oficio?.padre.slug === "clases-y-refuerzo" && Boolean(categoriaPorSlug("clases-y-refuerzo"));
}

export type ValoresFiltros = {
  insignias: InsigniaFiltro[];
  cal: CalificacionFiltro;
  visita: VisitaFiltro;
  hoy: boolean;
  h24: boolean;
  tambien: string[];
};

export const FILTROS_VACIOS: ValoresFiltros = { insignias: [], cal: "0", visita: "", hoy: false, h24: false, tambien: [] };

/** Lee de los parámetros de la URL solo los filtros del panel (no la consulta ni la localidad base). */
export function valoresDesdeParams(p: URLSearchParams): ValoresFiltros {
  const insignias = p.getAll("insignia").filter((i): i is InsigniaFiltro => (INSIGNIAS_FILTRO as readonly string[]).includes(i));
  const cal = p.get("cal");
  const visitaCruda = p.get("visita") ?? "";
  const visita: VisitaFiltro = visitaCruda === "convenir" ? "convenir" : TOPES_VISITA.includes(Number(visitaCruda)) ? (visitaCruda as VisitaFiltro) : "";
  return {
    insignias: [...new Set(insignias)],
    cal: cal === "4" || cal === "4.5" ? cal : "0",
    visita,
    hoy: p.get("hoy") === "1",
    h24: p.get("h24") === "1",
    tambien: p.getAll("tambien"),
  };
}

/** Escribe los filtros del panel en unos parámetros de URL (los vacíos no se escriben). */
export function paramsDesdeValores(v: ValoresFiltros, base?: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  for (const k of ["insignia", "cal", "visita", "hoy", "h24", "tambien", "pagina"]) p.delete(k);
  for (const i of v.insignias) p.append("insignia", i);
  if (v.cal !== "0") p.set("cal", v.cal);
  if (v.visita) p.set("visita", v.visita);
  if (v.hoy) p.set("hoy", "1");
  if (v.h24) p.set("h24", "1");
  for (const t of v.tambien) p.append("tambien", t);
  return p;
}
