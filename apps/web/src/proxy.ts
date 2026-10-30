/** Proxy (Next 16, runtime Node.js): sesión y consentimiento vigente en zonas privadas (RF-19). Edge no sirve: el driver `postgres` necesita TCP. */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "drizzle-orm";
import { consultar } from "@las3b/db";
import { OFICIOS_ELIMINADOS, OFICIOS_RENOMBRADOS } from "@las3b/shared";

const RUTAS_PUBLICAS = [
  "/",
  "/buscar",
  "/ingreso",
  "/ingreso/listo",
  "/admin/ingresar",
  "/recuperar",
  "/nueva-clave",
  "/consentimiento",
  "/api",
  "/_next",
  "/iconos",
  "/apple-icon",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
];

/** Zonas que exigen sesión; todo lo demás es público (páginas legales, SEO, portafolios /[slug]). */
const PREFIJOS_PRIVADOS = ["/admin", "/cuenta", "/proveedores", "/panel"];

function esRutaPublica(pathname: string): boolean {
  if (RUTAS_PUBLICAS.includes(pathname)) return true;
  const privada = PREFIJOS_PRIVADOS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return !privada;
}

/** 301 de URLs que cambiaron de oficio o de categoría (SEO): conservan su posicionamiento. */
function redireccionPermanente(url: URL): URL | null {
  const { pathname } = url;
  if (pathname === "/categorias/acarreos") return new URL("/categorias/acarreos-y-transporte", url);
  if (pathname === "/guias/seguridad-al-contratar-clases-o-cuidado-con-menores") return new URL("/guias/seguridad-al-contratar-clases-con-menores", url);
  const m = pathname.match(/^\/servicios\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  const [, oficio, resto = ""] = m;
  if (OFICIOS_ELIMINADOS.includes(oficio!)) return new URL("/categorias", url);
  const nuevo = OFICIOS_RENOMBRADOS[oficio!];
  return nuevo ? new URL(`/servicios/${nuevo}${resto}`, url) : null;
}

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;
  // Un solo ingreso: las rutas anteriores de ingreso y registro pasan a /ingreso (301).
  if (pathname === "/ingresar" || pathname === "/registro") {
    const destino = new URL("/ingreso", url);
    const d = url.searchParams.get("destino");
    if (d) destino.searchParams.set("destino", d);
    return NextResponse.redirect(destino, 301);
  }
  const destinoPermanente = redireccionPermanente(url);
  if (destinoPermanente) return NextResponse.redirect(destinoPermanente, 301);

  if (esRutaPublica(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    // El backoffice tiene su propio ingreso (con 2FA) y no se mezcla con el de clientes y proveedores.
    const ingreso = pathname === "/admin" || pathname.startsWith("/admin/") ? "/admin/ingresar" : "/ingreso";
    return NextResponse.redirect(new URL(ingreso, request.url));
  }

  // Verificar que el usuario tenga consentimientos registrados (RF-19). Una sola consulta: la base está lejos.
  const [c] = await consultar<{ falta: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM politicas WHERE esencial)
       AND NOT EXISTS (SELECT 1 FROM consentimientos WHERE usuario_id = ${session.user.id}) AS falta`);
  if (c?.falta) {
    return NextResponse.redirect(new URL("/consentimiento", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
