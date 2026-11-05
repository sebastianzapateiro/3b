/**
 * A0 · POST /api/v1/ayuda-inscripcion — «Que me llamen» del botón de ayuda para proveedores (CU-30).
 * Guarda la solicitud con la autorización de datos y limita los envíos por IP.
 */
import { NextResponse } from "next/server";
import { ipDeLaPeticion } from "@/lib/consentimientos";
import { crearSolicitudAyuda } from "@/lib/solicitudes-ayuda";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") return NextResponse.json({ error: "Revisa los datos e intenta de nuevo." }, { status: 400 });

  const r = await crearSolicitudAyuda(cuerpo, { ip: ipDeLaPeticion(req.headers), userAgent: req.headers.get("user-agent") });
  return "error" in r ? NextResponse.json(r, { status: 400 }) : NextResponse.json(r);
}
