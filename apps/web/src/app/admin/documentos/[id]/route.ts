/**
 * B1 · Abre un documento privado para el equipo (regla 2, CU-51): exige rol + 2FA, registra la apertura en
 * `auditoria` y redirige a una URL firmada de pocos minutos. Cada visita es una apertura auditada.
 */
import { NextResponse } from "next/server";
import { abrirDocumentoParaRevision } from "@/lib/documentos";
import { exigirBackoffice } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await exigirBackoffice();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Documento no válido" }, { status: 400 });
  const url = await abrirDocumentoParaRevision(id, { id: actor.user.id, rol: actor.rol });
  if (!url) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
