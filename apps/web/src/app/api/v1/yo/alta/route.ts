/**
 * POST /api/v1/yo/alta — autoguardado del alta completa del proveedor (CU-30). Con sesión de proveedor; guarda lo válido y
 * devuelve lo que no pudo guardar (`avisos`). Nunca borra lo ya guardado por un envío incompleto.
 */
import { NextResponse } from "next/server";
import { autoguardarAlta } from "@/lib/alta-autoguardado";
import { proveedorQueCarga } from "@/lib/documentos";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ guardados: [], avisos: {}, recargar: false }, { status: 401 });
  try {
    return NextResponse.json(await autoguardarAlta(p, await req.json().catch(() => null)));
  } catch (e) {
    console.error("[alta]", e);
    return NextResponse.json({ guardados: [], avisos: {}, recargar: false, error: true }, { status: 500 });
  }
}
