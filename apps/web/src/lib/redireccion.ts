/**
 * Transversal · Redirecciones absolutas desde route handlers y el proxy.
 * En el VPS Next corre con HOSTNAME=0.0.0.0 detrás de nginx, y `request.url` sale como https://0.0.0.0:3000/…;
 * por eso el origen se toma de X-Forwarded-Host / Host (nginx los fija con $host) y no de `request.url`.
 */
import { NextResponse } from "next/server";
import { SITIO_URL } from "./seo";

/** Origen público de la petición (ej. https://www.lastresb.com.co o http://localhost:3000). */
export function origenPublico(request: Request): string {
  const h = request.headers;
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (!host || host.startsWith("0.0.0.0")) return SITIO_URL;
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Redirige a una ruta del mismo sitio (ej. "/panel?bienvenida=1"). */
export function redirigir(request: Request, ruta: string, status?: number): NextResponse {
  return NextResponse.redirect(new URL(ruta, origenPublico(request)), status);
}
