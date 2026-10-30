/**
 * P2 · POST /api/v1/solicitudes — banner «¿Qué estás buscando?».
 * Guarda la solicitud (con la autorización de datos) y devuelve los proveedores del servicio, del más cercano al más lejano.
 * Deja una cookie con el id para que «Contactar por WA» arme el mensaje con lo que el comprador escribió.
 */
import { NextResponse } from "next/server";
import { ipDeLaPeticion } from "@/lib/consentimientos";
import { COOKIE_SOLICITUD, crearSolicitud } from "@/lib/solicitudes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") return NextResponse.json({ error: "Revisa los datos e intenta de nuevo." }, { status: 400 });

  const r = await crearSolicitud(cuerpo, { ip: ipDeLaPeticion(req.headers), userAgent: req.headers.get("user-agent") });
  if ("error" in r) return NextResponse.json(r, { status: 400 });

  const respuesta = NextResponse.json(r);
  respuesta.cookies.set(COOKIE_SOLICITUD, r.id, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax" });
  return respuesta;
}
