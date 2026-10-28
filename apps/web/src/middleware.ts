import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { user, consentimientos, politicas } = schema;

const RUTAS_PUBLICAS = [
  "/",
  "/buscar",
  "/ingresar",
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

function esRutaPublica(pathname: string): boolean {
  if (RUTAS_PUBLICAS.includes(pathname)) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/iconos/")) return true;
  if (pathname.startsWith("/[slug]")) return true; // portafolio público
  return false;
}

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  if (esRutaPublica(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
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
