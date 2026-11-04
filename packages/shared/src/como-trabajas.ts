/**
 * Opciones de «Cómo trabajas» que tienen sentido según el oficio: un cerrajero atiende urgencias y 24 horas,
 * una profesora de inglés no. La visita a convenir aplica a todos. Si todavía no eligió oficio, se ofrecen todas.
 */
export type OpcionComoTrabaja = "ofreceGarantia" | "atiendeUrgencias" | "disponible24h" | "visitaAConvenir";

const URGENCIAS = ["plomero", "electricista", "tecnico-de-gas", "cerrajero", "vidriero", "tecnico-de-neveras", "tecnico-de-lavadoras", "mantenimiento-de-calentadores", "veterinario"];

const GARANTIA = [
  ...URGENCIAS.filter((s) => s !== "veterinario"),
  "maestro-de-obra", "pintor", "impermeabilizacion", "instalador-de-pisos", "ornamentador", "carpintero", "tapicero", "todero",
  "cortinas-y-persianas", "instalador-de-tv-y-antenas", "instalador-de-camaras", "tecnico-de-computadores", "zapatero", "costurera",
  "lavado-de-carros", "fumigador", "lavado-de-tanques", "jardinero",
];

export function opcionesComoTrabaja(slugsOficios: string[]): Set<OpcionComoTrabaja> {
  const todas: OpcionComoTrabaja[] = ["ofreceGarantia", "atiendeUrgencias", "disponible24h", "visitaAConvenir"];
  if (slugsOficios.length === 0) return new Set(todas);
  const alguno = (lista: string[]) => slugsOficios.some((s) => lista.includes(s));
  const op = new Set<OpcionComoTrabaja>(["visitaAConvenir"]);
  if (alguno(GARANTIA)) op.add("ofreceGarantia");
  if (alguno(URGENCIAS)) { op.add("atiendeUrgencias"); op.add("disponible24h"); }
  return op;
}
