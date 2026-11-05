import { z } from "zod";

/**
 * Reglas del slug del portafolio (RF-44 a RF-47, CU-41).
 * lastresb.com.co/<slug>: minúsculas, números y guiones; único; sin palabras reservadas.
 */
export const SLUGS_RESERVADOS = new Set([
  "admin", "api", "app", "login", "ingresar", "registro", "salir", "cuenta",
  "buscar", "resultados", "categorias", "localidades", "proveedores", "proveedor",
  "terminos", "privacidad", "cookies", "resenas", "reclamos", "ayuda", "contacto",
  "guias", "como-funciona", "servicios", "nosotros", "contacto", "cookies", "terminos-proveedores", "retiro-de-contenido", "panel", "llms", "feed", "las3b", "lastresb", "static", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
  "manifest.webmanifest", ".well-known",
]);

export const slugSchema = z
  .string()
  .min(3, "Usa al menos 3 caracteres.")
  .max(60, "Usa máximo 60 caracteres.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones, sin guiones al inicio o al final.")
  .refine((s) => !SLUGS_RESERVADOS.has(s), "Esa dirección está reservada. Prueba otra.");

/** Sugiere un slug a partir del nombre y la localidad: "Jorge Ramírez", "Suba" → "jorge-ramirez-suba". */
export function sugerirSlug(nombre: string, localidad?: string): string {
  return [nombre, localidad]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Segmento de URL de un oficio: «Aseo y limpieza» → «aseo-y-limpieza». */
export const segmentoOficio = (nombreOficio: string): string => sugerirSlug(nombreOficio);

/** Oficio principal de la página: el primero por orden alfabético del segmento (estable aunque cambie el orden de guardado). */
export const oficioPrincipal = (nombresOficio: string[]): string | undefined => [...nombresOficio].sort((a, b) => segmentoOficio(a).localeCompare(segmentoOficio(b)))[0];

/** URL estándar de la página de un proveedor: /nombre-del-proveedor/oficio (p. ej. /clemencia-rojas/aseo-y-limpieza). */
export const rutaProveedor = (slug: string, nombreOficio?: string): string => (nombreOficio ? `/${slug}/${segmentoOficio(nombreOficio)}` : `/${slug}`);
