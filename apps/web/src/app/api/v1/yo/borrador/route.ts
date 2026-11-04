/**
 * POST /api/v1/yo/borrador — autoguardado de los campos de texto del alta mientras el proveedor escribe (B1 / CU-30).
 * Con sesión de proveedor; ignora lo inválido y nunca devuelve error al formulario.
 */
import { NextResponse } from "next/server";
import { autoguardarBorrador } from "@/lib/borrador";
import { proveedorQueCarga } from "@/lib/documentos";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ guardados: [] }, { status: 401 });
  try {
    return NextResponse.json(await autoguardarBorrador(p, await req.json().catch(() => null)));
  } catch (e) {
    console.error("[borrador]", e);
    return NextResponse.json({ guardados: [] });
  }
}
