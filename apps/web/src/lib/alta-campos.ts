/**
 * P8 · Alta en una sola página (CU-30): qué campos viajan en cada guardado automático. Lógica pura (la usa el navegador y se prueba con vitest).
 * Solo se envía lo que la persona tocó: los datos de identidad se pintan vacíos por seguridad (regla 1) y, si viajaran siempre,
 * el servidor los tomaría como «borrar». Los campos que el servidor lee juntos (oficios, localidades, redes, «cómo trabajas»,
 * tipo y número de documento) viajan en grupo.
 */

export type CampoAlta = { nombre: string; valor: string };
export type DatosAlta = Record<string, string | string[]>;

const COMO_TRABAJA = new Set(["_como", "ofreceGarantia", "atiendeUrgencias", "disponible24h", "visitaAConvenir"]);
/** Campos que pueden repetirse: se envían como lista. */
const LISTAS = new Set(["categoria", "localidad"]);

/** Grupo al que pertenece un campo: tocar uno marca todo el grupo para el siguiente guardado. */
export function grupoDeCampo(nombre: string): string {
  if (nombre.startsWith("red_")) return "redes";
  if (COMO_TRABAJA.has(nombre)) return "como";
  if (nombre === "tipoDocumento" || nombre === "documento") return "documento";
  return nombre;
}

/** De los campos de la pantalla (casillas y radios: solo los marcados), arma el envío con los grupos tocados. */
export function datosAEnviar(campos: CampoAlta[], tocados: ReadonlySet<string>): DatosAlta {
  const datos: DatosAlta = {};
  for (const { nombre, valor } of campos) {
    if (!tocados.has(grupoDeCampo(nombre))) continue;
    if (LISTAS.has(nombre)) datos[nombre] = [...((datos[nombre] as string[] | undefined) ?? []), valor];
    else datos[nombre] = valor;
  }
  return datos;
}

/**
 * Avisos después de un guardado: se conservan los de campos que no viajaron (siguen sin corregir), se quitan los de los grupos
 * enviados (y el general, «formulario», que es de cada envío) y se agregan los nuevos. El servidor nombra cada aviso con su grupo («redes», «documento», «categoria»…).
 */
export function combinarAvisos(previos: Record<string, string>, enviados: ReadonlySet<string>, nuevos: Record<string, string>): Record<string, string> {
  return { ...Object.fromEntries(Object.entries(previos).filter(([k]) => k !== "formulario" && !enviados.has(k))), ...nuevos };
}
