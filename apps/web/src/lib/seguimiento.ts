/**
 * B1 · Seguimiento interno de cada proveedor (fuente, contactos, próxima acción, notas). Solo para el equipo.
 */
export const FUENTES_ORIGEN = [
  ["google_maps", "Google Maps"],
  ["instagram", "Instagram"],
  ["ferreteria", "Ferretería"],
  ["referido", "Referido"],
  ["otro", "Otro"],
] as const;

export type FuenteOrigen = (typeof FUENTES_ORIGEN)[number][0];

export const VALORES_FUENTE = FUENTES_ORIGEN.map(([v]) => v) as [FuenteOrigen, ...FuenteOrigen[]];

export const etiquetaFuente = (f: string | null) => FUENTES_ORIGEN.find(([v]) => v === f)?.[1] ?? "—";

/** Hoy en formato AAAA-MM-DD, en la hora de Bogotá. */
export const hoyBogota = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
