/**
 * Avisos por correo al proveedor durante la revisión de su registro: recibido, aprobado, rechazado.
 * Si la cuenta tiene el correo de relleno del alta asistida (sin correo real), no se envía nada: el equipo
 * avisa por WhatsApp con las plantillas `whatsappProveedorAprobado` / `whatsappProveedorRechazado`.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { enviarCorreo } from "@/lib/correo";
import { esCorreoFicticio } from "@/lib/invitaciones";
import { proveedorAprobado, proveedorRechazado, registroRecibido } from "@/lib/plantillas";

async function destinatario(proveedorId: string) {
  const [f] = await db
    .select({ correo: schema.user.email, nombre: schema.user.name, nombrePublico: schema.proveedores.nombrePublico, slug: schema.proveedores.slug })
    .from(schema.proveedores)
    .innerJoin(schema.user, eq(schema.user.id, schema.proveedores.usuarioId))
    .where(eq(schema.proveedores.id, proveedorId))
    .limit(1);
  return f && !esCorreoFicticio(f.correo) ? f : null;
}

export async function avisarRegistroRecibido(proveedorId: string) {
  const d = await destinatario(proveedorId);
  if (d) void enviarCorreo({ para: d.correo, ...registroRecibido({ nombre: d.nombre }) });
}

export async function avisarProveedorAprobado(proveedorId: string) {
  const d = await destinatario(proveedorId);
  if (d) void enviarCorreo({ para: d.correo, ...proveedorAprobado({ nombre: d.nombre, nombrePublico: d.nombrePublico, slug: d.slug }) });
}

export async function avisarProveedorRechazado(proveedorId: string, motivo: string) {
  const d = await destinatario(proveedorId);
  if (d) void enviarCorreo({ para: d.correo, ...proveedorRechazado({ nombre: d.nombre, motivo }) });
}
