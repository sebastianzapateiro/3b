/**
 * P3 / P8 · Alta de proveedor dentro del panel (CU-30). Al elegir «proveedor» se crea un borrador y la persona
 * entra directo a /panel, donde completa las tareas pendientes y envía a revisión.
 * Para el proveedor con sesión. Los datos de identidad nunca salen en público (regla 1).
 */
import { cache } from "react";
import { and, count, eq, inArray, isNotNull, asc } from "drizzle-orm";
import { z } from "zod";
import { db, protegerDocumento, schema } from "@las3b/db";
import { normalizarWhatsapp, slugSchema, sugerirSlug, SLUGS_RESERVADOS } from "@las3b/shared";
import { estadoDocumentos } from "@/lib/documentos";
import { FOTOS_MINIMAS, guardarCompletitud } from "@/lib/completitud";

const { proveedores, proveedorCategorias, proveedorLocalidades, serviciosProveedor, categorias, portafolioFotos } = schema;

type Resultado = { ok: true } | { error: string };

/** Primera dirección libre a partir de una base: «jairo-perez», «jairo-perez-2», … */
async function slugLibre(base: string): Promise<string> {
  const raiz = slugSchema.safeParse(base).success ? base : `proveedor-${base || "nuevo"}`.slice(0, 50).replace(/-+$/, "");
  for (let i = 1; i < 50; i++) {
    const candidato = i === 1 ? raiz : `${raiz}-${i}`;
    if (SLUGS_RESERVADOS.has(candidato)) continue;
    const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, candidato)).limit(1);
    if (!existe) return candidato;
  }
  return `${raiz}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Crea el borrador del proveedor (idempotente). Nombre y dirección salen de la cuenta; se editan en el panel. */
export async function crearBorrador(usuario: { id: string; name?: string | null; email: string }) {
  const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.usuarioId, usuario.id)).limit(1);
  if (existe) return existe.id;
  const nombre = usuario.name?.trim() || usuario.email.split("@")[0]!;
  const [p] = await db
    .insert(proveedores)
    .values({ usuarioId: usuario.id, estado: "borrador", nombrePublico: nombre, slug: await slugLibre(sugerirSlug(nombre)), whatsapp: "" })
    .onConflictDoNothing({ target: proveedores.usuarioId })
    .returning({ id: proveedores.id });
  if (p) {
    await guardarCompletitud(p.id);
    return p.id;
  }
  // Otra petición lo creó al mismo tiempo.
  const [otro] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.usuarioId, usuario.id)).limit(1);
  return otro!.id;
}

export type SeccionPanel = "perfil" | "servicios" | "fotos" | "verificacion";
export type TareaAlta = { clave: string; titulo: string; texto: string; ok: boolean; href: string; seccion: SeccionPanel; opcional?: boolean };

/**
 * Qué le falta al borrador para enviarlo a revisión. `listo` ignora las tareas opcionales.
 * Con cache(): el layout y la página del panel lo piden en la misma petición y se consulta una sola vez.
 */
export const pendientesAlta = cache(async (proveedorId: string) => {
  const [[p], [cats], [locs], [servs], docs, [fotos]] = await Promise.all([
    db
      .select({
        nombre: proveedores.nombrePublico,
        whatsapp: proveedores.whatsapp,
        segmento: proveedores.segmento,
        presentacion: proveedores.presentacion,
        tipoDocumento: proveedores.tipoDocumento,
        documento: proveedores.documentoCifrado,
        direccion: proveedores.direccionNotificaciones,
        nacimiento: proveedores.fechaNacimiento,
      })
      .from(proveedores)
      .where(eq(proveedores.id, proveedorId))
      .limit(1),
    db.select({ n: count() }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ n: count() }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
    db.select({ n: count() }).from(serviciosProveedor).where(eq(serviciosProveedor.proveedorId, proveedorId)),
    estadoDocumentos(proveedorId),
    db.select({ n: count() }).from(portafolioFotos).where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible"))),
  ]);
  const tareas: TareaAlta[] = [
    { clave: "negocio", titulo: "Datos de tu negocio", texto: "Nombre, WhatsApp, oficio y la dirección de tu página.", ok: Boolean(p?.nombre.trim() && p.whatsapp.trim() && p.segmento && (cats?.n ?? 0) > 0), href: "/panel/perfil#negocio", seccion: "perfil" },
    { clave: "localidades", titulo: "Dónde trabajas", texto: "Las localidades de Bogotá en las que atiendes.", ok: (locs?.n ?? 0) > 0, href: "/panel/perfil#localidades", seccion: "perfil" },
    { clave: "servicios", titulo: "Tus servicios", texto: "Al menos un servicio, con su precio desde.", ok: (servs?.n ?? 0) > 0, href: "/panel/servicios", seccion: "servicios" },
    { clave: "identidad", titulo: "Datos de identidad", texto: "Documento, dirección y fecha de nacimiento. Son privados.", ok: Boolean(p?.tipoDocumento && p.documento && p.direccion && p.nacimiento), href: "/panel/verificacion#identidad", seccion: "verificacion" },
    { clave: "documentos", titulo: "Fotos de tus documentos", texto: docs.faltan.length ? `Falta: ${docs.faltan.join(", ")}.` : "Las que pide tu tipo de negocio y tu oficio.", ok: docs.faltan.length === 0, href: "/panel/verificacion#documentos", seccion: "verificacion" },
    { clave: "fotos", titulo: "Fotos de tus trabajos", texto: `Sube al menos ${FOTOS_MINIMAS}: los clientes escriben más cuando ven tu trabajo.`, ok: (fotos?.n ?? 0) >= FOTOS_MINIMAS, href: "/panel/fotos", seccion: "fotos", opcional: true },
    { clave: "sobre", titulo: "Sobre mí", texto: "Cuéntales a los clientes cómo trabajas. Ayuda a que te escriban.", ok: Boolean(p?.presentacion?.trim()), href: "/panel/perfil#sobre", seccion: "perfil", opcional: true },
  ];
  const obligatorias = tareas.filter((t) => !t.opcional);
  const hechas = tareas.filter((t) => t.ok).length;
  return {
    tareas,
    hechas,
    porcentaje: Math.round((hechas / tareas.length) * 100),
    listo: obligatorias.every((t) => t.ok),
    /** Primera obligatoria pendiente; si no hay, la primera opcional pendiente. */
    siguiente: obligatorias.find((t) => !t.ok) ?? tareas.find((t) => !t.ok) ?? null,
    faltanDocs: docs.faltan,
  };
});

export type AltaProveedor = Awaited<ReturnType<typeof pendientesAlta>>;

/** A dónde llevar al proveedor después de guardar un paso del alta: la siguiente tarea obligatoria, o al Resumen para enviar. */
export async function rutaSiguientePaso(proveedorId: string, aviso: string): Promise<string> {
  const alta = await pendientesAlta(proveedorId);
  const falta = alta.tareas.find((t) => !t.ok && !t.opcional);
  if (!falta) return `/panel?${new URLSearchParams({ ok: `${aviso} Ya tienes todo: revisa y envía tu perfil.` })}`;
  const [ruta, ancla] = falta.href.split("#");
  return `${ruta}?${new URLSearchParams({ ok: `${aviso} Sigue con: ${falta.titulo.toLowerCase()}.` })}${ancla ? `#${ancla}` : ""}`;
}

/** Oficios que puede elegir el proveedor (subcategorías activas). */
export async function oficiosDisponibles() {
  return db.select({ id: categorias.id, nombre: categorias.nombre }).from(categorias).where(and(isNotNull(categorias.padreId), eq(categorias.activa, true))).orderBy(asc(categorias.nombre));
}

/** Oficios disponibles y los que ya eligió el proveedor, para el formulario del negocio. */
export async function negocioEditable(proveedorId: string) {
  const [oficios, elegidos] = await Promise.all([
    oficiosDisponibles(),
    db.select({ id: proveedorCategorias.categoriaId }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
  ]);
  return { oficios, elegidos: new Set(elegidos.map((e) => e.id)) };
}

const esquemaNegocio = z.object({
  nombrePublico: z.string().trim().min(2, "Escribe el nombre de tu negocio.").max(80, "El nombre admite hasta 80 caracteres."),
  whatsapp: z.string().transform((v, ctx) => normalizarWhatsapp(v) ?? (ctx.addIssue({ code: "custom", message: "Escribe un WhatsApp válido, por ejemplo 300 123 4567." }), z.NEVER)),
  segmento: z.enum(["independiente_sin_rut", "independiente_con_rut", "empresa"], { message: "Elige si eres independiente o empresa." }),
  slug: slugSchema,
});

/**
 * Datos del negocio: solo mientras es borrador (después, nombre, dirección y oficio los revisa el equipo).
 */
export async function guardarNegocio(proveedor: { id: string; estado: string }, formData: FormData): Promise<Resultado> {
  if (proveedor.estado !== "borrador") return { error: "Tu perfil ya fue enviado: para cambiar estos datos escríbenos." };
  const r = esquemaNegocio.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  const categoriaIds = formData.getAll("categoria").map(Number).filter(Number.isInteger);
  if (categoriaIds.length === 0) return { error: "Elige al menos un oficio." };
  if (categoriaIds.length > 3) return { error: "Elige máximo 3 oficios." };

  const [ocupado] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, r.data.slug)).limit(1);
  if (ocupado && ocupado.id !== proveedor.id) return { error: "Esa dirección ya está en uso. Prueba otra." };
  const validas = await db.select({ id: categorias.id }).from(categorias).where(and(inArray(categorias.id, categoriaIds), isNotNull(categorias.padreId), eq(categorias.activa, true)));
  if (validas.length !== categoriaIds.length) return { error: "Uno de los oficios no está disponible." };

  await db.transaction(async (tx) => {
    await tx.update(proveedores).set({ ...r.data, updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
    await tx.delete(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedor.id));
    await tx.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: proveedor.id, categoriaId })));
  });
  await guardarCompletitud(proveedor.id);
  return { ok: true };
}

const esquemaIdentidad = z.object({
  tipoDocumento: z.enum(["cc", "ce", "ppt", "nit"], { message: "Elige el tipo de documento." }),
  documento: z.string().trim().regex(/^[0-9A-Za-z-]{4,20}$/, "Escribe el número de documento sin puntos ni espacios."),
  direccionNotificaciones: z.string().trim().min(6, "Escribe tu dirección de notificaciones.").max(160),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe tu fecha de nacimiento."),
});

/** Mayor de edad a la fecha de hoy (Colombia: 18 años). */
export function esMayorDeEdad(fechaIso: string, hoy = new Date()): boolean {
  const [a, m, d] = fechaIso.split("-").map(Number) as [number, number, number];
  const cumple18 = new Date(Date.UTC(a + 18, m - 1, d));
  return cumple18.getTime() <= Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
}

/** Datos de identidad para la verificación. El documento se guarda cifrado con su huella (regla 1). Solo en borrador. */
export async function guardarIdentidad(proveedor: { id: string; estado: string }, formData: FormData): Promise<Resultado> {
  if (proveedor.estado !== "borrador") return { error: "Tu perfil ya fue enviado: para cambiar tus datos de identidad escríbenos." };
  const r = esquemaIdentidad.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  if (!esMayorDeEdad(r.data.fechaNacimiento)) return { error: "Debes ser mayor de edad para registrarte como proveedor." };
  await db
    .update(proveedores)
    .set({
      tipoDocumento: r.data.tipoDocumento,
      ...protegerDocumento(r.data.documento),
      direccionNotificaciones: r.data.direccionNotificaciones,
      fechaNacimiento: r.data.fechaNacimiento,
      updatedAt: new Date(),
    })
    .where(eq(proveedores.id, proveedor.id));
  return { ok: true };
}

/** 573001234567 → «300 123 4567» para mostrarlo en el campo. */
export function whatsappParaCampo(v: string): string {
  const d = v.replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("57") ? d.slice(2) : d;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : v;
}
