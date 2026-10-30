/**
 * B1 · Confirma un documento que el equipo subió a nombre de un proveedor: valida el tipo real y lo registra.
 * POST { tipo, camino }. Cada carga queda en `auditoria` (regla 3).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { confirmarSubida } from "@/lib/documentos";
import { verificarSesionAdmin } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

const cuerpo = z.object({ tipo: z.string().max(40), camino: z.string().max(200) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user || !v.rol) return NextResponse.json({ error: "Sin acceso al backoffice" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Proveedor no válido" }, { status: 400 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await confirmarSubida(id, datos.data);
  if ("error" in r) return NextResponse.json(r, { status: 422 });
  await auditar({ actorId: v.user.id, rol: v.rol, accion: "documento_cargado_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { tipo: r.tipo, documentoId: r.id } });
  return NextResponse.json(r, { status: 201 });
}
