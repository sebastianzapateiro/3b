/** B8 · Exporta el registro de auditoría a CSV. Solo administradores; la exportación misma queda auditada. */
import { auditar } from "@/lib/auditoria";
import { ETIQUETA_ACCION, listarAuditoria } from "@/lib/auditoria-consulta";
import { verificarSesionAdmin } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user || !v.roles.includes("admin")) return new Response("No autorizado", { status: 403 });

  const p = new URL(req.url).searchParams;
  const filtro = { usuario: p.get("usuario") ?? undefined, accion: p.get("accion") ?? undefined, desde: p.get("desde") ?? undefined };
  const filas = await listarAuditoria(filtro, 5000);
  await auditar({ actorId: v.user.id, rol: v.rol, accion: "auditoria_exportada", objetoTipo: "auditoria", resultado: `${filas.length} filas`, metadatos: filtro });

  const csv = [
    ["fecha", "quien", "rol", "accion", "objeto_tipo", "objeto_id", "resultado", "motivo", "ip"].join(","),
    ...filas.map((f) => [f.fecha.toISOString(), f.quien ?? f.correo ?? "Sistema", f.rol, ETIQUETA_ACCION[f.accion] ?? f.accion, f.objetoTipo, f.objetoId, f.resultado, f.motivo, f.ip].map(celda).join(",")),
  ].join("\n");

  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
