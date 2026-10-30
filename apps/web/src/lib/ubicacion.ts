/**
 * P2 · Ubicación del comprador y cercanía a los proveedores (banner «¿Qué estás buscando?»).
 * Los proveedores no publican dirección: se mide la distancia al centro de cada localidad donde trabajan (aproximada).
 * La dirección del comprador se convierte en coordenadas con Google si hay GOOGLE_MAPS_API_KEY; sin clave, solo sirve su ubicación del navegador.
 */
import { CENTROS_LOCALIDADES, type LocalidadSlug } from "@las3b/shared";

export type Punto = { lat: number; lng: number };

/** Caja aproximada de Bogotá, para no aceptar coordenadas de otra ciudad. */
const BOGOTA = { sur: 3.7, norte: 4.85, oeste: -74.3, este: -73.9 };

export const enBogota = (p: Punto) => p.lat >= BOGOTA.sur && p.lat <= BOGOTA.norte && p.lng >= BOGOTA.oeste && p.lng <= BOGOTA.este;

/** Distancia en km entre dos puntos (fórmula de haversine). */
export function distanciaKm(a: Punto, b: Punto): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Distancia mínima del punto al centro de cualquiera de las localidades del proveedor; null si ninguna es conocida. */
export function distanciaALocalidades(punto: Punto, slugs: string[]): number | null {
  const km = slugs.map((s) => CENTROS_LOCALIDADES[s as LocalidadSlug]).filter(Boolean).map(([lat, lng]) => distanciaKm(punto, { lat, lng }));
  return km.length ? Math.min(...km) : null;
}

/** Dirección escrita → coordenadas. Devuelve null sin clave, sin resultado o fuera de Bogotá. */
export async function geocodificar(direccion: string): Promise<Punto | null> {
  const clave = process.env.GOOGLE_MAPS_API_KEY;
  if (!clave || !direccion.trim()) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", `${direccion}, Bogotá, Colombia`);
    url.searchParams.set("components", "country:CO");
    url.searchParams.set("language", "es");
    url.searchParams.set("key", clave);
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const j = (await r.json()) as { results?: { geometry?: { location?: { lat: number; lng: number } } }[] };
    const l = j.results?.[0]?.geometry?.location;
    const punto = l ? { lat: l.lat, lng: l.lng } : null;
    return punto && enBogota(punto) ? punto : null;
  } catch {
    return null;
  }
}
