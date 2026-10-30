/** B7 · Exporta las solicitudes de clientes (con sus contactos) a CSV. Solo administradores; la exportación queda auditada. */
import { auditar } from "@/lib/auditoria";
import { listarSolicitudes } from "@/lib/solicitudes";
import { verificarSesionAdmin } from "@/lib/verificacion";

export const dynamic = "force-dynamic";

const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user || !v.roles.includes("admin")) return new Response("No autorizado", { status: 403 });

  const p = new URL(req.url).searchParams;
  const filas = await listarSolicitudes({ estado: p.get("estado") ?? undefined, sinResultado: p.get("sin") === "1", q: p.get("q") ?? undefined }, 10000);
  await auditar({ actorId: v.user.id, rol: v.rol, accion: "solicitudes_exportadas", objetoTipo: "solicitud", resultado: `${filas.length} filas` });

  const csv = [
    ["fecha", "estado", "nombre", "whatsapp", "solicitud", "categoria", "localidad", "direccion_exacta", "con_coordenadas", "proveedores_encontrados", "banner", "autorizacion_version", "contactos_a_proveedores", "mensajes"].join(","),
    ...filas.map((s) => [
      s.creada.toISOString(), s.estado, s.nombre, s.whatsapp, s.texto, s.categoria, s.localidad, s.direccion, s.lat != null ? "si" : "no", s.resultados, s.origen, s.version,
      s.contactos.map((c) => c.proveedor).join(" | "), s.contactos.map((c) => c.mensaje).join(" | "),
    ].map(celda).join(",")),
  ].join("\n");

  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="solicitudes-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
