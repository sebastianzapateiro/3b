/**
 * P2 · Solicitudes del buscador «¿Qué estás buscando?» del inicio (CU-01, Ley 1581). Para la web, la API pública y el backoffice.
 * Cada solicitud guarda quién pide, qué pide, para qué localidad o ubicación exacta, cuántos proveedores había y qué autorizó:
 * es demanda real del negocio y no se borra. Los contactos posteriores se ligan a ella (`contactos.solicitud_id`).
 */
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { contieneServicioProhibido, MENSAJE_CONTACTO_MAX, normalizarWhatsapp, TRATAMIENTO_DATOS } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { buscarProveedores, categoriaDeTexto, contarProveedores } from "@/lib/busqueda";
import { desdeRango, type RangoTablero } from "@/lib/admin";
import { hoyBogota } from "@/lib/seguimiento";
import { type EstadoSolicitud, VALORES_ESTADO } from "@/lib/seguimiento-solicitudes";
import { enBogota, geocodificar, type Punto } from "@/lib/ubicacion";

const { solicitudesServicio, categorias, localidades } = schema;

export const COOKIE_SOLICITUD = "l3b_solicitud";

/** Límites contra abuso, por hora. Viven en código porque protegen el sistema; no son reglas de negocio. */
const MAX_POR_IP = 6;
const MAX_POR_NUMERO = 4;

export const esquemaSolicitud = z.object({
  texto: z.string().trim().min(2, "Cuéntanos qué necesitas.").max(MENSAJE_CONTACTO_MAX, `Escribe hasta ${MENSAJE_CONTACTO_MAX} caracteres.`),
  /** Opcionales: el buscador del inicio no los pide. Solo llegan cuando la persona deja su WhatsApp para que la avisen (búsqueda sin resultados). */
  nombre: z.string().trim().max(80).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  autoriza: z.boolean().optional(),
  /** «Ubicación para el servicio»: por localidad o por ubicación exacta. */
  ubicacion: z.enum(["localidad", "exacta"]).default("localidad"),
  localidad: z.string().trim().max(60).optional(),
  direccion: z.string().trim().max(200).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  origen: z.string().trim().max(40).default("web"),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export type RespuestaSolicitud = { error: string } | { id: string; prohibido: boolean; total: number; enviarPorWhatsapp: boolean };

export async function crearSolicitud(entrada: unknown, red: { ip: string | null; userAgent: string | null }): Promise<RespuestaSolicitud> {
  const r = esquemaSolicitud.safeParse(entrada);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  const d = r.data;
  const whatsapp = d.whatsapp ? normalizarWhatsapp(d.whatsapp) : null;
  if (d.whatsapp && !whatsapp) return { error: "Revisa el número de WhatsApp." };
  if (whatsapp && (!d.nombre || d.nombre.length < 2)) return { error: "Escribe tu nombre." };
  if (whatsapp && !d.autoriza) return { error: "Para avisarte necesitamos tu autorización para tratar tus datos." };

  const [loc] = d.ubicacion === "localidad" && d.localidad ? await db.select({ id: localidades.id }).from(localidades).where(eq(localidades.slug, d.localidad)).limit(1) : [];
  if (d.ubicacion === "localidad" && !loc) return { error: "Elige la localidad del servicio." };
  const dado = d.lat != null && d.lng != null && Number.isFinite(d.lat) && Number.isFinite(d.lng) ? { lat: d.lat, lng: d.lng } : null;
  if (d.ubicacion === "exacta" && !d.direccion && !dado) return { error: "Escribe la ubicación exacta del servicio o usa tu ubicación actual." };

  const desde = new Date(Date.now() - 3_600_000);
  const [porIp, porNumero] = await Promise.all([
    red.ip ? db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(eq(solicitudesServicio.ip, red.ip), gt(solicitudesServicio.createdAt, desde))) : [{ n: 0 }],
    whatsapp ? db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(eq(solicitudesServicio.whatsapp, whatsapp), gt(solicitudesServicio.createdAt, desde))) : [{ n: 0 }],
  ]);
  if ((porIp[0]?.n ?? 0) >= MAX_POR_IP || (porNumero[0]?.n ?? 0) >= MAX_POR_NUMERO) return { error: "Hiciste varias solicitudes seguidas. Intenta de nuevo en un rato." };

  // Categoría: la que mejor corresponde a lo que escribió.
  const categoria = await categoriaDeTexto(d.texto);
  const prohibido = contieneServicioProhibido(`${d.texto} ${categoria?.nombre ?? ""}`);

  // Punto: ubicación del navegador (si es de Bogotá) o la dirección escrita. Solo aplica a la ubicación exacta.
  const punto: Punto | null = d.ubicacion !== "exacta" ? null : dado && enBogota(dado) ? dado : d.direccion ? await geocodificar(d.direccion) : null;

  const filtros = categoria ? { categoria: categoria.slug } : { q: d.texto };
  const total = prohibido ? 0 : await contarProveedores(d.ubicacion === "localidad" ? { ...filtros, localidad: d.localidad } : filtros);

  // Foto de lo que se le mostró (los primeros), para que el equipo vea qué proveedores arrojó la búsqueda.
  const filtrosListado = d.ubicacion === "localidad" ? { ...filtros, localidad: d.localidad } : { ...filtros, ...(punto ? { punto } : {}) };
  const mostrados = prohibido || total === 0 ? [] : (await buscarProveedores(filtrosListado)).items.slice(0, 10).map((p) => ({ slug: p.slug, nombre: p.nombre }));

  const [fila] = await db
    .insert(solicitudesServicio)
    .values({
      oficioSlug: categoria?.slug ?? null,
      categoriaId: categoria?.id ?? null,
      textoLibre: d.texto,
      nombre: d.nombre || null,
      whatsapp,
      // La búsqueda no pide datos personales: la autorización llega al dejar el WhatsApp o al contactar a un proveedor (registrarDatosContacto).
      autorizaDatos: Boolean(whatsapp),
      consentimientoVersion: whatsapp ? TRATAMIENTO_DATOS.version : null,
      localidadId: loc?.id ?? null,
      direccion: d.ubicacion === "exacta" ? d.direccion || null : null,
      lat: punto?.lat ?? (d.ubicacion === "exacta" ? dado?.lat : null) ?? null,
      lng: punto?.lng ?? (d.ubicacion === "exacta" ? dado?.lng : null) ?? null,
      origenBanner: d.origen,
      resultados: total,
      proveedoresMostrados: mostrados,
      cuentaComoDemanda: !prohibido,
      ip: red.ip,
      userAgent: red.userAgent,
    })
    .returning({ id: solicitudesServicio.id });

  return { id: fila!.id, prohibido, total, enviarPorWhatsapp: !prohibido && total === 0 };
}

export const esquemaDatosContacto = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  whatsapp: z.string().trim().max(20),
  autoriza: z.literal(true, { error: "Para contactar al proveedor necesitamos tu autorización para tratar tus datos." }),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

/**
 * Se piden al conectar con un proveedor, no al buscar: guarda nombre, WhatsApp y la autorización de datos (versión, IP y navegador).
 * Si la persona ya hizo una búsqueda (`solicitudId`) los agrega a esa solicitud; si llegó directo a un perfil crea una solicitud mínima.
 */
export async function registrarDatosContacto(solicitudId: string | null, entrada: unknown, red: { ip: string | null; userAgent: string | null }): Promise<{ error: string } | { id: string }> {
  const r = esquemaDatosContacto.safeParse(entrada);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  const whatsapp = normalizarWhatsapp(r.data.whatsapp);
  if (!whatsapp) return { error: "Revisa el número de WhatsApp." };
  const desde = new Date(Date.now() - 3_600_000);
  const [seguidas] = await db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(eq(solicitudesServicio.whatsapp, whatsapp), gt(solicitudesServicio.createdAt, desde)));
  if ((seguidas?.n ?? 0) >=MAX_POR_NUMERO * 3) return { error: "Hiciste varias solicitudes seguidas. Intenta de nuevo en un rato." };

  const datos = { nombre: r.data.nombre, whatsapp, autorizaDatos: true, consentimientoVersion: TRATAMIENTO_DATOS.version, ip: red.ip, userAgent: red.userAgent };
  if (solicitudId) {
    const [fila] = await db.update(solicitudesServicio).set(datos).where(eq(solicitudesServicio.id, solicitudId)).returning({ id: solicitudesServicio.id });
    if (fila) return { id: fila.id };
  }
  const [fila] = await db.insert(solicitudesServicio).values({ ...datos, origenBanner: "contacto" }).returning({ id: solicitudesServicio.id });
  return { id: fila!.id };
}

/** Texto del lugar para el mensaje al proveedor: «la localidad Suba» o «la ubicación Calle 80 # 20-30». */
export function lugarDeSolicitud(s: { localidad: string | null; direccion: string | null; lat: number | null; lng: number | null }): string | null {
  if (s.direccion) return `la ubicación ${s.direccion}`;
  if (s.lat != null && s.lng != null) return `la ubicación https://maps.google.com/?q=${s.lat},${s.lng}`;
  return s.localidad ? `la localidad ${s.localidad}` : null;
}

/** B7 · Solicitudes para el administrador, con los contactos (y el mensaje exacto) que cada una generó. */
export async function listarSolicitudes(f: { estado?: string; sinResultado?: boolean; q?: string; todas?: boolean; responsableId?: string; vencidas?: boolean; demanda?: { oficioSlug?: string; texto?: string; localidadSlug?: string; rango: RangoTablero } }, limite = 200) {
  const condiciones = [
    f.estado && VALORES_ESTADO.includes(f.estado as EstadoSolicitud) ? eq(solicitudesServicio.estado, f.estado as EstadoSolicitud) : undefined,
    // Por defecto solo los casos con contacto (dejaron su WhatsApp): son los que se pueden gestionar.
    f.todas ? undefined : sql`${solicitudesServicio.whatsapp} IS NOT NULL`,
    f.responsableId ? eq(solicitudesServicio.responsableId, f.responsableId) : undefined,
    f.vencidas ? sql`${solicitudesServicio.estado} NOT IN ('atendida','sin_proveedor','descartada') AND ${solicitudesServicio.proximaAccionEn} <= ${hoyBogota()}` : undefined,
    f.sinResultado ? eq(solicitudesServicio.resultados, 0) : undefined,
    // Viene de «Demanda sin cubrir» del tablero: mismo servicio, misma localidad y mismo periodo.
    ...(f.demanda ? [
      sql`${solicitudesServicio.cuentaComoDemanda} AND ${solicitudesServicio.createdAt} >= ${desdeRango(f.demanda.rango)}`,
      f.demanda.oficioSlug ? eq(solicitudesServicio.oficioSlug, f.demanda.oficioSlug) : sql`${solicitudesServicio.oficioSlug} IS NULL AND coalesce(nullif(trim(${solicitudesServicio.textoLibre}), ''), '') = ${f.demanda.texto ?? ""}`,
      f.demanda.localidadSlug ? sql`${solicitudesServicio.localidadId} = (SELECT id FROM localidades WHERE slug = ${f.demanda.localidadSlug})` : sql`${solicitudesServicio.localidadId} IS NULL`,
    ] : []),
    f.q?.trim() ? sql`(${solicitudesServicio.nombre} ILIKE ${`%${f.q.trim()}%`} OR ${solicitudesServicio.whatsapp} LIKE ${`%${f.q.replace(/\D/g, "") || "~"}%`} OR ${solicitudesServicio.textoLibre} ILIKE ${`%${f.q.trim()}%`})` : undefined,
  ].filter((c) => c !== undefined);

  const filas = await db
    .select({
      id: solicitudesServicio.id, creada: solicitudesServicio.createdAt, estado: solicitudesServicio.estado, nombre: solicitudesServicio.nombre,
      whatsapp: solicitudesServicio.whatsapp, texto: solicitudesServicio.textoLibre, categoria: categorias.nombre, direccion: solicitudesServicio.direccion,
      localidad: localidades.nombre, lat: solicitudesServicio.lat, lng: solicitudesServicio.lng, resultados: solicitudesServicio.resultados, mostrados: solicitudesServicio.proveedoresMostrados, origen: solicitudesServicio.origenBanner,
      version: solicitudesServicio.consentimientoVersion, demanda: solicitudesServicio.cuentaComoDemanda,
      categoriaSlug: categorias.slug, localidadSlug: localidades.slug, responsableId: solicitudesServicio.responsableId,
      responsable: schema.user.name, proximaAccion: solicitudesServicio.proximaAccionEn, actualizada: solicitudesServicio.actualizadaEn,
    })
    .from(solicitudesServicio)
    .leftJoin(categorias, eq(categorias.id, solicitudesServicio.categoriaId))
    .leftJoin(localidades, eq(localidades.id, solicitudesServicio.localidadId))
    .leftJoin(schema.user, eq(schema.user.id, solicitudesServicio.responsableId))
    .where(and(...condiciones))
    // Abiertas primero, con la próxima acción más vieja arriba; luego las más recientes.
    .orderBy(sql`CASE WHEN ${solicitudesServicio.estado} IN ('atendida','sin_proveedor','descartada') THEN 1 ELSE 0 END`, sql`${solicitudesServicio.proximaAccionEn} ASC NULLS LAST`, sql`${solicitudesServicio.createdAt} DESC`)
    .limit(limite);
  if (filas.length === 0) return [];

  const contactos = await db
    .select({ solicitudId: schema.contactos.solicitudId, proveedor: schema.proveedores.nombrePublico, mensaje: schema.contactos.mensaje, cuando: schema.contactos.createdAt })
    .from(schema.contactos)
    .innerJoin(schema.proveedores, eq(schema.proveedores.id, schema.contactos.proveedorId))
    .where(inArray(schema.contactos.solicitudId, filas.map((s) => s.id)))
    .orderBy(sql`${schema.contactos.createdAt} ASC`);

  return filas.map((s) => ({ ...s, lugar: lugarDeSolicitud(s), contactos: contactos.filter((c) => c.solicitudId === s.id) }));
}

/** Datos para armar el mensaje a un proveedor y, si es por ubicación exacta, el punto para ordenar por cercanía. */
export async function obtenerSolicitud(id: string) {
  const [s] = await db
    .select({
      id: solicitudesServicio.id, nombre: solicitudesServicio.nombre, texto: solicitudesServicio.textoLibre, categoria: categorias.nombre,
      autorizado: solicitudesServicio.autorizaDatos, localidad: localidades.nombre, direccion: solicitudesServicio.direccion, lat: solicitudesServicio.lat, lng: solicitudesServicio.lng,
    })
    .from(solicitudesServicio)
    .leftJoin(categorias, eq(categorias.id, solicitudesServicio.categoriaId))
    .leftJoin(localidades, eq(localidades.id, solicitudesServicio.localidadId))
    .where(eq(solicitudesServicio.id, id))
    .limit(1);
  if (!s) return null;
  return {
    id: s.id,
    nombre: s.nombre,
    /** Lo que escribió la persona, sin texto de relleno; null si llegó directo a un perfil. */
    textoOriginal: s.texto,
    /** true cuando ya dio nombre, WhatsApp y la autorización de datos (al contactar a un proveedor). */
    autorizado: s.autorizado,
    categoria: s.categoria,
    lugar: lugarDeSolicitud(s),
    punto: s.lat != null && s.lng != null && !s.localidad ? { lat: s.lat, lng: s.lng } : null,
    texto: s.texto ?? (s.categoria ? `Busco ${s.categoria.toLowerCase()}` : "Busco un servicio"),
  };
}
