import { z } from "zod";

/**
 * Reglas del slug del portafolio (RF-44 a RF-47, CU-41).
 * lastresb.com.co/<slug>: minúsculas, números y guiones; único; sin palabras reservadas.
 */
export const SLUGS_RESERVADOS = new Set([
  "admin", "api", "app", "login", "ingresar", "registro", "salir", "cuenta",
  "buscar", "resultados", "categorias", "localidades", "proveedores", "proveedor",
  "terminos", "privacidad", "cookies", "resenas", "reclamos", "ayuda", "contacto",
  "guias", "como-funciona", "servicios", "cookies", "terminos-proveedores", "retiro-de-contenido", "panel", "llms", "feed", "las3b", "lastresb", "static", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
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
