/**
 * P3 / P8 · Documentos privados del proveedor con sesión (regla 2). Web y app móvil.
 * GET: requisitos y estado (sin rutas del bucket). POST { tipo, camino }: confirma una subida hecha con la URL firmada.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmarSubida, estadoDocumentos, proveedorQueCarga } from "@/lib/documentos";

export const dynamic = "force-dynamic";

export async function GET() {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ error: "Sin perfil de proveedor" }, { status: 401 });
  return NextResponse.json(await estadoDocumentos(p.id));
}

const cuerpo = z.object({ tipo: z.string().max(40), camino: z.string().max(200) });

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ error: "Sin perfil de proveedor" }, { status: 401 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await confirmarSubida(p.id, datos.data);
  return "error" in r ? NextResponse.json(r, { status: 422 }) : NextResponse.json(r, { status: 201 });
}
