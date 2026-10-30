/**
 * B1 · El equipo sube un documento a nombre de un proveedor (alta asistida, o fotos que el proveedor mandó por
 * WhatsApp). POST { tipo, mime, bytes } → { camino, url }; después PUT a `url` y POST a ../documentos.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prepararSubida } from "@/lib/documentos";
import { verificarSesionAdmin } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

const cuerpo = z.object({ tipo: z.string().max(40), mime: z.string().max(60), bytes: z.number().int() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user) return NextResponse.json({ error: "Sin acceso al backoffice" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Proveedor no válido" }, { status: 400 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await prepararSubida(id, datos.data);
  return "error" in r ? NextResponse.json(r, { status: 422 }) : NextResponse.json(r);
}
