"use server";

/** CU-10 · Reclamo de consumo (Ley 1480 de 2011, art. 53). Cualquier persona puede presentarlo, con o sin cuenta. */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { enviarCorreo } from "@/lib/correo";
import { sumarDiasHabiles } from "@/lib/cuenta";
import { parametro } from "@/lib/parametros";

const esquema = z.object({
  proveedor: z.string().trim().min(2, "Dinos a qué proveedor corresponde el reclamo.").max(300),
  nombre: z.string().trim().min(3, "Escribe tu nombre.").max(120),
  correo: z.string().trim().email("Revisa tu correo."),
  codigo: z.string().trim().max(20).optional(),
  descripcion: z.string().trim().min(30, "Cuéntanos con más detalle qué pasó (mínimo 30 caracteres).").max(3000),
  autoriza: z.literal("on", { message: "Debes autorizar el tratamiento de tus datos para tramitar el reclamo." }),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

/** Acepta el enlace del perfil, su dirección (slug) o el nombre exacto del proveedor. */
async function resolverProveedor(texto: string) {
  const slug = texto.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop()?.toLowerCase() ?? "";
  const [porSlug] = await db.select({ id: schema.proveedores.id, nombre: schema.proveedores.nombrePublico }).from(schema.proveedores).where(eq(schema.proveedores.slug, slug)).limit(1);
  if (porSlug) return porSlug;
  const porNombre = await db.select({ id: schema.proveedores.id, nombre: schema.proveedores.nombrePublico }).from(schema.proveedores).where(sql`lower(${schema.proveedores.nombrePublico}) = lower(${texto})`).limit(2);
  return porNombre.length === 1 ? porNombre[0]! : null;
}

export async function presentarReclamo(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  const volver = (error: string): never => redirect(`/reclamos?${new URLSearchParams({ error, proveedor: String(formData.get("proveedor") ?? "") })}#formulario`);
  if (!r.success) return volver(r.error.issues[0]?.message ?? "Revisa los datos.");
  const d = r.data;

  const proveedor = await resolverProveedor(d.proveedor);
  if (!proveedor) return volver("No encontramos ese proveedor. Pega el enlace de su página (lastresb.com.co/su-nombre).");

  const session = await auth.api.getSession({ headers: await headers() });
  const plazo = await parametro("plazo_reclamo_consumo_dias_habiles");
  const fechaLimite = await sumarDiasHabiles(new Date(), plazo);

  const [nuevo] = await db
    .insert(schema.reclamos)
    .values({
      proveedorId: proveedor.id,
      reclamanteId: session?.user?.id ?? null,
      nombreReclamante: d.nombre,
      correoReclamante: d.correo,
      codigoServicio: d.codigo || null,
      descripcion: d.descripcion,
      // El comprador tiene derecho a conocer la identificación y el contacto del proveedor (art. 53): se entrega siempre que se pida.
      solicitaDatosProveedor: formData.get("solicitaDatos") === "on",
      fechaLimite,
    })
    .returning({ id: schema.reclamos.id });

  const radicado = nuevo!.id.slice(0, 8).toUpperCase();
  await enviarCorreo({
    para: d.correo,
    asunto: `Recibimos tu reclamo ${radicado} en LasTresB`,
    texto: `Hola, ${d.nombre}.\n\nRecibimos tu reclamo sobre ${proveedor.nombre} (radicado ${radicado}). Te responderemos a más tardar el ${fechaLimite}, contando días hábiles.\n\nLasTresB es un portal de contacto: facilitamos la comunicación con el proveedor y, si lo pediste, te entregamos sus datos de identificación y contacto.`,
  });
  redirect(`/reclamos?${new URLSearchParams({ enviado: radicado, limite: fechaLimite })}#formulario`);
}