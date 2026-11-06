/**
 * Autoguardado del borrador (B1 / CU-30): mientras el proveedor escribe, se guardan los campos de texto que ya son
 * válidos, sin exigir que termine el formulario. Si abandona a medias, el equipo igual se entera (registro de actividad).
 * Solo campos de contacto y texto: nunca el documento ni la fecha de nacimiento, que se guardan al enviar el formulario.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { normalizarWhatsapp, PRESENTACION_MAX } from "@las3b/shared";
import { registrarEvento } from "@/lib/actividad";

const { proveedores } = schema;

/** Cada campo permitido con su regla; el que no cumple se ignora en silencio (se corrige al enviar el formulario). */
const CAMPOS = {
  nombrePublico: { etiqueta: "nombre", valida: (v: string) => (v.length >= 2 && v.length <= 80 ? v : null) },
  whatsapp: { etiqueta: "WhatsApp", valida: (v: string) => normalizarWhatsapp(v) },
  presentacion: { etiqueta: "presentación", valida: (v: string) => (v.length <= PRESENTACION_MAX ? v : null) },
  direccionNotificaciones: { etiqueta: "dirección", valida: (v: string) => (v.length >= 6 && v.length <= 160 ? v : null) },
  numeroMatricula: { etiqueta: "n.º de matrícula", valida: (v: string) => (v.length >= 1 && v.length <= 30 ? v : null) },
} as const;

export const esquemaBorrador = z.record(z.string(), z.string().max(400));

export async function autoguardarBorrador(proveedor: { id: string; estado: string }, entrada: unknown): Promise<{ guardados: string[] }> {
  if (proveedor.estado !== "borrador") return { guardados: [] };
  const datos = esquemaBorrador.safeParse(entrada);
  if (!datos.success) return { guardados: [] };

  const [actual] = await db
    .select({ nombrePublico: proveedores.nombrePublico, whatsapp: proveedores.whatsapp, presentacion: proveedores.presentacion, direccionNotificaciones: proveedores.direccionNotificaciones, numeroMatricula: proveedores.numeroMatricula })
    .from(proveedores)
    .where(eq(proveedores.id, proveedor.id))
    .limit(1);
  if (!actual) return { guardados: [] };

  const cambios: Record<string, string> = {};
  for (const [campo, regla] of Object.entries(CAMPOS)) {
    const crudo = datos.data[campo]?.trim();
    if (crudo === undefined || crudo === "") continue;
    const valor = regla.valida(crudo);
    if (valor && valor !== (actual as Record<string, string | null>)[campo]) cambios[campo] = valor;
  }
  const nombres = Object.keys(cambios);
  if (nombres.length === 0) return { guardados: [] };

  await db.update(proveedores).set({ ...cambios, updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
  await registrarEvento(proveedor.id, "cambios", { campos: nombres.map((n) => CAMPOS[n as keyof typeof CAMPOS].etiqueta), detalle: "Guardado automático" });
  return { guardados: nombres };
}
