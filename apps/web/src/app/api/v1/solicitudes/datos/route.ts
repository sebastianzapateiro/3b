/**
 * POST /api/v1/solicitudes/datos — nombre, WhatsApp y autorización de datos del comprador, pedidos al conectar con un proveedor.
 * Usa la solicitud de la cookie (si hizo una búsqueda) o crea una mínima, y deja la cookie para los siguientes contactos.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ipDeLaPeticion } from "@/lib/consentimientos";
import { COOKIE_SOLICITUD, registrarDatosContacto } from "@/lib/solicitudes";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") return NextResponse.json({ error: "Revisa los datos e intenta de nuevo." }, { status: 400 });

  const previa = (await cookies()).get(COOKIE_SOLICITUD)?.value;
  const r = await registrarDatosContacto(previa && UUID.test(previa) ? previa : null, cuerpo, { ip: ipDeLaPeticion(req.headers), userAgent: req.headers.get("user-agent") });
  if ("error" in r) return NextResponse.json(r, { status: 400 });

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SOLICITUD, r.id, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax" });
  return respuesta;
}
