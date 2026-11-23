/**
 * B4 · Avisos por correo al equipo cuando alguien crea una cuenta (con correo o con Google). Para el equipo de LasTresB.
 * Los destinatarios se cambian en la tabla `configuracion`, clave `correos_aviso_registro` (lista JSON de correos);
 * sin esa fila se usan los de `DESTINATARIOS_POR_DEFECTO`. Un fallo al avisar nunca bloquea el registro.
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { subcategoriaPorSlug } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { enviarCorreo } from "@/lib/correo";
import { nuevoRegistroEquipo } from "@/lib/plantillas";

const CLAVE = "correos_aviso_registro";
const DESTINATARIOS_POR_DEFECTO = ["andres.becerr13@hotmail.com", "zapateirosebastian@gmail.com"];

/** Correos que reciben el aviso: los de `configuracion` si hay una lista válida, si no los de por defecto. */
export async function correosAvisoRegistro(): Promise<string[]> {
  const [c] = await db.select({ valor: schema.configuracion.valor }).from(schema.configuracion).where(eq(schema.configuracion.clave, CLAVE)).limit(1);
  const lista = z.array(z.string().email()).safeParse(c?.valor);
  return lista.success ? lista.data : DESTINATARIOS_POR_DEFECTO;
}

export async function avisarRegistroAlEquipo(d: { nombre: string; correo: string; telefono?: string | null; tipo: "proveedor" | "cliente"; metodo: string; oficios: string[] }) {
  try {
    const oficios = d.oficios.map((s) => subcategoriaPorSlug(s)?.sub.nombre ?? s);
    const mensaje = nuevoRegistroEquipo({ ...d, oficios });
    for (const para of await correosAvisoRegistro()) await enviarCorreo({ para, ...mensaje });
  } catch (e) {
    console.error("[avisos-equipo] No se pudo avisar del registro:", e);
  }
}
