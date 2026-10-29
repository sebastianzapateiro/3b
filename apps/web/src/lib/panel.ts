/**
 * P8 · Panel del proveedor: resumen, perfil, servicios, reseñas y verificación.
 * Solo datos del propio proveedor; nunca expone documento, dirección ni fecha de nacimiento (regla 1).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";

const { proveedores, serviciosProveedor, resenas, respuestasResena, user, proveedorCategorias, proveedorLocalidades, categorias, localidades, documentos, proveedorInsignias, insignias, portafolioFotos } = schema;

/** Sesión + registro de proveedor. Sin sesión va a ingresar; sin registro, al alta de proveedor. */
export async function exigirProveedor() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/ingresar?${new URLSearchParams({ destino: "/panel" })}`);
  const [p] = await db
    .select({
      id: proveedores.id,
      slug: proveedores.slug,
      nombre: proveedores.nombrePublico,
      estado: proveedores.estado,
      segmento: proveedores.segmento,
      presentacion: proveedores.presentacion,
      aniosExperiencia: proveedores.aniosExperiencia,
      emiteFactura: proveedores.emiteFactura,
      ofreceGarantia: proveedores.ofreceGarantia,
      motivoRechazo: proveedores.motivoRechazo,
      rutFechaLimite: proveedores.rutFechaLimite,
      promedio: proveedores.promedio,
      totalResenas: proveedores.totalResenas,
    })
    .from(proveedores)
    .where(eq(proveedores.usuarioId, session.user.id))
    .limit(1);
  if (!p) redirect("/proveedores/registro");
  return { proveedor: p, usuario: session.user };
}

export type ProveedorPanel = Awaited<ReturnType<typeof exigirProveedor>>["proveedor"];

export async function resumenPanel(proveedorId: string) {
  const [[c], [r], servicios, [f], cats, locs, [d]] = await Promise.all([
    db.select({ siete: sql<number>`count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int`, treinta: sql<number>`count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int`, total: sql<number>`count(*)::int` }).from(schema.contactos).where(eq(schema.contactos.proveedorId, proveedorId)),
    db.select({ sinResponder: sql<number>`count(*) FILTER (WHERE rr.resena_id IS NULL)::int` }).from(resenas).leftJoin(sql`respuestas_resena rr`, sql`rr.resena_id = ${resenas.id}`).where(and(eq(resenas.proveedorId, proveedorId), eq(resenas.estado, "visible"))),
    db.select({ n: sql<number>`count(*)::int` }).from(serviciosProveedor).where(and(eq(serviciosProveedor.proveedorId, proveedorId), eq(serviciosProveedor.visible, true))),
    db.select({ n: sql<number>`count(*)::int` }).from(portafolioFotos).where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible"))),
    db.select({ n: sql<number>`count(*)::int` }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ n: sql<number>`count(*)::int` }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
    db.select({ n: sql<number>`count(*)::int` }).from(documentos).where(eq(documentos.proveedorId, proveedorId)),
  ]);
  return {
    contactos7: c?.siete ?? 0,
    contactos30: c?.treinta ?? 0,
    contactosTotal: c?.total ?? 0,
    resenasSinResponder: r?.sinResponder ?? 0,
    servicios: servicios[0]?.n ?? 0,
    fotos: f?.n ?? 0,
    categorias: cats[0]?.n ?? 0,
    localidades: locs[0]?.n ?? 0,
    documentos: d?.n ?? 0,
  };
}

export async function serviciosDelProveedor(proveedorId: string) {
  return db.select().from(serviciosProveedor).where(and(eq(serviciosProveedor.proveedorId, proveedorId), eq(serviciosProveedor.visible, true))).orderBy(asc(serviciosProveedor.orden), asc(serviciosProveedor.id));
}

export async function resenasDelProveedor(proveedorId: string) {
  return db
    .select({
      id: resenas.id,
      fecha: resenas.createdAt,
      cliente: user.name,
      comentario: resenas.comentario,
      puntualidad: resenas.puntualidad,
      calidad: resenas.calidad,
      calidadPrecio: resenas.calidadPrecio,
      cumplimiento: resenas.cumplimiento,
      respuesta: respuestasResena.texto,
    })
    .from(resenas)
    .innerJoin(user, eq(user.id, resenas.compradorId))
    .leftJoin(respuestasResena, eq(respuestasResena.resenaId, resenas.id))
    .where(and(eq(resenas.proveedorId, proveedorId), eq(resenas.estado, "visible")))
    .orderBy(desc(resenas.createdAt))
    .limit(50);
}

export async function perfilEditable(proveedorId: string) {
  const [cats, locsElegidas, todas] = await Promise.all([
    db.select({ nombre: categorias.nombre }).from(proveedorCategorias).innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId)).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ id: proveedorLocalidades.localidadId }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
    db.select({ id: localidades.id, nombre: localidades.nombre }).from(localidades).where(eq(localidades.activa, true)).orderBy(asc(localidades.numero)),
  ]);
  return { categorias: cats.map((c) => c.nombre), localidadesElegidas: new Set(locsElegidas.map((l) => l.id)), localidades: todas };
}

export async function verificacionDelProveedor(proveedorId: string) {
  const [docs, ins] = await Promise.all([
    db.select({ tipo: documentos.tipo }).from(documentos).where(eq(documentos.proveedorId, proveedorId)),
    db.select({ clave: insignias.clave, nombre: insignias.nombre, vence: proveedorInsignias.vence }).from(proveedorInsignias).innerJoin(insignias, eq(insignias.id, proveedorInsignias.insigniaId)).where(eq(proveedorInsignias.proveedorId, proveedorId)),
  ]);
  return { documentos: docs.map((d) => d.tipo as string), insignias: ins };
}
