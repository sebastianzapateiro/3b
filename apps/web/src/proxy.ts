/** Proxy (Next 16, runtime Node.js): sesión y consentimiento vigente en zonas privadas (RF-19). Edge no sirve: el driver `postgres` necesita TCP. */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { OFICIOS_ELIMINADOS, OFICIOS_RENOMBRADOS } from "@las3b/shared";

const { user, consentimientos, politicas } = schema;

const RUTAS_PUBLICAS = [
  "/",
  "/buscar",
  "/ingresar",
  "/admin/ingresar",
  "/registro",
  "/recuperar",
  "/nueva-clave",
  "/cuenta/consentimiento",
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
  const destinoPermanente = redireccionPermanente(url);
  if (destinoPermanente) return NextResponse.redirect(destinoPermanente, 301);

  if (esRutaPublica(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    const ingreso = pathname.startsWith("/admin") ? "/admin/ingresar" : "/ingresar";
    return NextResponse.redirect(new URL(ingreso, request.url));
  }

  // Verificar que el usuario tenga consentimientos registrados (RF-19).
  const [vigente] = await db
    .select({ id: politicas.id })
    .from(politicas)
    .where(eq(politicas.esencial, true))
    .limit(1);

  if (vigente) {
    const tieneConsentimiento = await db
      .select({ id: consentimientos.id })
      .from(consentimientos)
      .where(eq(consentimientos.usuarioId, session.user.id))
      .limit(1);

    if (!tieneConsentimiento[0]) {
      return NextResponse.redirect(
        new URL("/cuenta/consentimiento", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
