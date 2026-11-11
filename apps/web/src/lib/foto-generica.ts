/**
 * P2/P3 · Foto de perfil genérica (silueta) para proveedores que aún no suben la suya. Se elige según el oficio: electricidad, aseo y
 * cuidado del hogar, transporte y obra/reparaciones. Para los demás oficios no hay silueta y se siguen mostrando las iniciales.
 * Es solo de presentación: NO cuenta como foto real para indexar la ficha (lib/indexacion.ts).
 * Imágenes en public/perfiles/ (banco de imágenes del proyecto).
 */
import { CATEGORIAS } from "@las3b/shared";

type Silueta = "electricidad" | "transporte" | "aseo" | "obra";

const POR_SLUG: Record<string, Silueta> = {
  electricista: "electricidad", "electricista-automotriz": "electricidad", "instalador-de-camaras": "electricidad", domotica: "electricidad", "instalador-de-tv-y-antenas": "electricidad",
  trasteos: "transporte", fletes: "transporte", "retiro-de-escombros": "transporte", "embalaje-y-guardamuebles": "transporte", mensajeria: "transporte",
  aseo: "aseo", planchado: "aseo", "cocina-a-domicilio": "aseo", fumigador: "aseo", "lavado-de-tanques": "aseo",
  plomero: "obra", "tecnico-de-gas": "obra", "tecnico-de-neveras": "obra", "tecnico-de-lavadoras": "obra", cerrajero: "obra", vidriero: "obra", "mantenimiento-de-calentadores": "obra",
  "maestro-de-obra": "obra", pintor: "obra", impermeabilizacion: "obra", "instalador-de-pisos": "obra", ornamentador: "obra", carpintero: "obra", tapicero: "obra", todero: "obra",
  "cortinas-y-persianas": "obra", "mallas-de-seguridad": "obra", "purificadores-y-filtros-de-agua": "obra", jardinero: "obra", "mecanico-automotriz": "obra", "mecanico-de-motos": "obra",
  "latoneria-y-pintura": "obra", "llantas-y-alineacion": "obra", "mecanico-de-bicicletas": "obra", zapatero: "obra",
};

const SLUG_DE_NOMBRE = new Map(CATEGORIAS.flatMap((c) => c.subcategorias.map((s) => [s.nombre, s.slug] as const)));
/** Si un proveedor tiene oficios de varios grupos, gana el primero de esta lista. */
const PRIORIDAD: Silueta[] = ["electricidad", "transporte", "aseo", "obra"];

/** Ruta de la silueta para los oficios (por nombre) de un proveedor, o null si ningún oficio tiene. */
export function fotoGenericaPara(nombresOficio: string[]): string | null {
  const grupos = new Set(nombresOficio.map((n) => SLUG_DE_NOMBRE.get(n)).map((s) => (s ? POR_SLUG[s] : undefined)));
  const g = PRIORIDAD.find((p) => grupos.has(p));
  return g ? `/perfiles/${g}.webp` : null;
}
