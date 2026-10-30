"use server";

/** P8 · Acciones del panel del proveedor. Todas verifican que el recurso sea del proveedor con sesión. */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { headers } from "next/headers";
import { ipDeLaPeticion, registrarConsentimientos } from "@/lib/consentimientos";
import { estadoDocumentos } from "@/lib/documentos";
import { datosParaConfirmar, exigirProveedor } from "@/lib/panel";

const { proveedores, serviciosProveedor, resenas, respuestasResena, proveedorLocalidades } = schema;

const volver = (ruta: string, params: Record<string, string>): never => redirect(`${ruta}?${new URLSearchParams(params)}`);
const pagina = (ruta: string) => {
  revalidatePath(ruta);
  revalidatePath("/panel");
};

/* Perfil */

const esquemaPerfil = z.object({
  presentacion: z.string().trim().max(280, "La presentación admite hasta 280 caracteres.").optional(),
  aniosExperiencia: z.coerce.number().int().min(0).max(80).optional().or(z.literal("").transform(() => undefined)),
});

export async function guardarPerfil(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const r = esquemaPerfil.safeParse(Object.fromEntries(formData));
  if (!r.success) return volver("/panel/perfil", { error: r.error.issues[0]?.message ?? "Revisa los datos." });

  const localidadIds = formData.getAll("localidad").map(Number).filter(Number.isInteger);
  if (localidadIds.length === 0) return volver("/panel/perfil", { error: "Elige al menos una localidad." });

  await db
    .update(proveedores)
    .set({
      presentacion: r.data.presentacion || null,
      aniosExperiencia: r.data.aniosExperiencia ?? null,
      emiteFactura: formData.has("emiteFactura"),
      ofreceGarantia: formData.has("ofreceGarantia"),
      atiendeUrgencias: formData.has("atiendeUrgencias"),
      disponible24h: formData.has("disponible24h"),
      visitaAConvenir: formData.has("visitaAConvenir"),
      updatedAt: new Date(),
    })
    .where(eq(proveedores.id, proveedor.id));

  await db.delete(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedor.id));
  await db.insert(proveedorLocalidades).values(localidadIds.map((localidadId) => ({ proveedorId: proveedor.id, localidadId })));

  pagina("/panel/perfil");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel/perfil", { ok: "Perfil guardado." });
}

/** Pausar muestra «no disponible» en el perfil; reactivar lo vuelve a publicar. Solo si ya fue aprobado. */
export async function cambiarPausa(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const pausar = formData.get("accion") === "pausar";
  if (pausar && proveedor.estado !== "aprobado") return volver("/panel", { error: "Solo puedes pausar un perfil aprobado." });
  if (!pausar && proveedor.estado !== "pausado") return volver("/panel", { error: "Tu perfil no está pausado." });

  await db.update(proveedores).set({ estado: pausar ? "pausado" : "aprobado", updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
  pagina("/panel");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel", { ok: pausar ? "Tu perfil quedó en pausa: muestra «no disponible»." : "Tu perfil volvió a estar visible." });
}

/* Servicios y precios */

const esquemaServicio = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre del servicio.").max(80),
  descripcion: z.string().trim().max(140).optional(),
  precio: z.string().optional(),
  unidad: z.enum(["visita", "hora", "clase", "metro2", "trayecto", "trabajo"]),
});

function datosServicio(formData: FormData) {
  const r = esquemaServicio.safeParse(Object.fromEntries(formData));
  if (!r.success) return volver("/panel/servicios", { error: r.error.issues[0]?.message ?? "Revisa los datos." });
  const precio = r.data.precio?.replace(/\D/g, "");
  return { nombre: r.data.nombre, descripcion: r.data.descripcion || null, precioDesde: precio || null, unidad: r.data.unidad };
}

export async function agregarServicio(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const d = datosServicio(formData);
  await db.insert(serviciosProveedor).values({ proveedorId: proveedor.id, ...d });
  pagina("/panel/servicios");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel/servicios", { ok: "Servicio agregado." });
}

export async function actualizarServicio(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const id = z.coerce.number().int().parse(formData.get("id"));
  const d = datosServicio(formData);
  await db.update(serviciosProveedor).set(d).where(and(eq(serviciosProveedor.id, id), eq(serviciosProveedor.proveedorId, proveedor.id)));
  pagina("/panel/servicios");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel/servicios", { ok: "Servicio actualizado." });
}

export async function quitarServicio(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const id = z.coerce.number().int().parse(formData.get("id"));
  await db.update(serviciosProveedor).set({ visible: false }).where(and(eq(serviciosProveedor.id, id), eq(serviciosProveedor.proveedorId, proveedor.id)));
  pagina("/panel/servicios");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel/servicios", { ok: "Servicio quitado." });
}

/* Reseñas (CU-45: una sola respuesta por reseña, no editable) */

export async function responderResena(formData: FormData) {
  const { proveedor } = await exigirProveedor();
  const id = z.string().uuid().parse(formData.get("id"));
  const texto = z.string().trim().min(2, "Escribe tu respuesta.").max(500, "La respuesta admite hasta 500 caracteres.").safeParse(formData.get("texto"));
  if (!texto.success) return volver("/panel/resenas", { error: texto.error.issues[0]?.message ?? "Revisa tu respuesta." });

  const [propia] = await db.select({ id: resenas.id }).from(resenas).where(and(eq(resenas.id, id), eq(resenas.proveedorId, proveedor.id))).limit(1);
  if (!propia) return volver("/panel/resenas", { error: "Esa reseña no es de tu perfil." });

  await db.insert(respuestasResena).values({ resenaId: id, texto: texto.data }).onConflictDoNothing();
  pagina("/panel/resenas");
  revalidatePath(`/${proveedor.slug}`);
  return volver("/panel/resenas", { ok: "Respuesta publicada." });
}

/* Alta asistida: el proveedor confirma y envía a revisión (CU-51, Ley 1581) */

export async function enviarARevision(formData: FormData) {
  const { proveedor, usuario } = await exigirProveedor();
  if (proveedor.estado !== "borrador") return volver("/panel", { error: "Tu perfil ya fue enviado a revisión." });

  const docs = await estadoDocumentos(proveedor.id);
  if (docs.faltan.length) return volver("/panel/confirmar", { error: `Falta cargar: ${docs.faltan.join(", ")}.` });
  const { exigeLey1918 } = await datosParaConfirmar(proveedor.id);
  // Casillas no premarcadas (regla 5): las marca el proveedor, nunca el equipo.
  if (formData.get("aceptaTerminosProveedor") !== "on") return volver("/panel/confirmar", { error: "Debes aceptar los términos para proveedores." });
  if (formData.get("aceptaDatos") !== "on") return volver("/panel/confirmar", { error: "Debes autorizar el tratamiento de tus datos personales para verificar tu identidad." });
  if (formData.get("declaraNoPermitidos") !== "on") return volver("/panel/confirmar", { error: "Debes declarar que no ofrecerás transporte de personas ni servicios de salud o cuidado de personas." });
  if (exigeLey1918 && formData.get("autorizaLey1918") !== "on") return volver("/panel/confirmar", { error: "Tu categoría trabaja con menores: debes autorizar la consulta de antecedentes (Ley 1918)." });

  const h = await headers();
  await registrarConsentimientos(
    usuario.id,
    ["terminos_proveedores", "tratamiento_datos", "declaracion_servicios_no_permitidos", ...(exigeLey1918 ? (["autorizacion_ley_1918"] as const) : [])],
    { ip: ipDeLaPeticion(h), userAgent: h.get("user-agent") },
  );
  await db.update(proveedores).set({ estado: "pendiente", updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
  revalidatePath("/panel", "layout");
  revalidatePath("/admin", "layout");
  return volver("/panel", { ok: "Listo: enviaste tu perfil a revisión. Te avisamos cuando quede publicado." });
}
