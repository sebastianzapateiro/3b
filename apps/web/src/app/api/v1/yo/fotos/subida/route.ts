/**
 * P8 · Pide una URL firmada de un solo uso para subir una foto de trabajo.
 * POST { mime, bytes } → { camino, url }. Después: PUT de la foto a `url` y POST /api/v1/yo/fotos.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { proveedorQueCarga } from "@/lib/documentos";
import { prepararFoto } from "@/lib/fotos";

export const dynamic = "force-dynamic";

const cuerpo = z.object({ mime: z.string().max(60), bytes: z.number().int() });

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ error: "Sin perfil de proveedor" }, { status: 401 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await prepararFoto(p.id, datos.data);
  return "error" in r ? NextResponse.json(r, { status: 422 }) : NextResponse.json(r);
}
