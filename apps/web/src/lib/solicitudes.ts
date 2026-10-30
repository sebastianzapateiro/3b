/**
 * P2 · Solicitudes del buscador «¿Qué estás buscando?» del inicio (CU-01, Ley 1581). Para la web, la API pública y el backoffice.
 * Cada solicitud guarda quién pide, qué pide, para qué localidad o ubicación exacta, cuántos proveedores había y qué autorizó:
 * es demanda real del negocio y no se borra. Los contactos posteriores se ligan a ella (`contactos.solicitud_id`).
 */
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { contieneServicioProhibido, MENSAJE_CONTACTO_MAX, normalizarWhatsapp, TRATAMIENTO_DATOS } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { categoriaDeTexto, contarProveedores } from "@/lib/busqueda";
import { enBogota, geocodificar, type Punto } from "@/lib/ubicacion";

const { solicitudesServicio, categorias, localidades } = schema;

export const COOKIE_SOLICITUD = "l3b_solicitud";

/** Límites contra abuso, por hora. Viven en código porque protegen el sistema; no son reglas de negocio. */
const MAX_POR_IP = 6;
const MAX_POR_NUMERO = 4;

export const esquemaSolicitud = z.object({
  texto: z.string().trim().min(2, "Cuéntanos qué necesitas.").max(MENSAJE_CONTACTO_MAX, `Escribe hasta ${MENSAJE_CONTACTO_MAX} caracteres.`),
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  whatsapp: z.string().trim().max(20),
  /** «Ubicación para el servicio»: por localidad o por ubicación exacta. */
  ubicacion: z.enum(["localidad", "exacta"]).default("localidad"),
  localidad: z.string().trim().max(60).optional(),
  direccion: z.string().trim().max(200).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  autoriza: z.literal(true, { error: "Para ayudarte necesitamos tu autorización para tratar tus datos." }),
  origen: z.string().trim().max(40).default("web"),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export type RespuestaSolicitud = { error: string } | { id: string; prohibido: boolean; total: number; enviarPorWhatsapp: boolean };

export async function crearSolicitud(entrada: unknown, red: { ip: string | null; userAgent: string | null }): Promise<RespuestaSolicitud> {
  const r = esquemaSolicitud.safeParse(entrada);
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  const d = r.data;
  const whatsapp = normalizarWhatsapp(d.whatsapp);
  if (!whatsapp) return { error: "Revisa el número de WhatsApp." };

  const [loc] = d.ubicacion === "localidad" && d.localidad ? await db.select({ id: localidades.id }).from(localidades).where(eq(localidades.slug, d.localidad)).limit(1) : [];
  if (d.ubicacion === "localidad" && !loc) return { error: "Elige la localidad del servicio." };
  const dado = d.lat != null && d.lng != null && Number.isFinite(d.lat) && Number.isFinite(d.lng) ? { lat: d.lat, lng: d.lng } : null;
  if (d.ubicacion === "exacta" && !d.direccion && !dado) return { error: "Escribe la ubicación exacta del servicio o usa tu ubicación actual." };

  const desde = new Date(Date.now() - 3_600_000);
  const [porIp, porNumero] = await Promise.all([
    red.ip ? db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(eq(solicitudesServicio.ip, red.ip), gt(solicitudesServicio.createdAt, desde))) : [{ n: 0 }],
    db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(eq(solicitudesServicio.whatsapp, whatsapp), gt(solicitudesServicio.createdAt, desde))),
  ]);
  if ((porIp[0]?.n ?? 0) >= MAX_POR_IP || (porNumero[0]?.n ?? 0) >= MAX_POR_NUMERO) return { error: "Hiciste varias solicitudes seguidas. Intenta de nuevo en un rato." };

  // Categoría: la que mejor corresponde a lo que escribió.
  const categoria = await categoriaDeTexto(d.texto);
  const prohibido = contieneServicioProhibido(`${d.texto} ${categoria?.nombre ?? ""}`);

  // Punto: ubicación del navegador (si es de Bogotá) o la dirección escrita. Solo aplica a la ubicación exacta.
  const punto: Punto | null = d.ubicacion !== "exacta" ? null : dado && enBogota(dado) ? dado : d.direccion ? await geocodificar(d.direccion) : null;

  const filtros = categoria ? { categoria: categoria.slug } : { q: d.texto };
  const total = prohibido ? 0 : await contarProveedores(d.ubicacion === "localidad" ? { ...filtros, localidad: d.localidad } : filtros);

  const [fila] = await db
    .insert(solicitudesServicio)
    .values({
      oficioSlug: categoria?.slug ?? null,
      categoriaId: categoria?.id ?? null,
      textoLibre: d.texto,
      nombre: d.nombre,
      whatsapp,
      autorizaDatos: true,
      localidadId: loc?.id ?? null,
      direccion: d.ubicacion === "exacta" ? d.direccion || null : null,
      lat: punto?.lat ?? (d.ubicacion === "exacta" ? dado?.lat : null) ?? null,
      lng: punto?.lng ?? (d.ubicacion === "exacta" ? dado?.lng : null) ?? null,
      origenBanner: d.origen,
      resultados: total,
      cuentaComoDemanda: !prohibido,
      consentimientoVersion: TRATAMIENTO_DATOS.version,
      ip: red.ip,
      userAgent: red.userAgent,
    })
    .returning({ id: solicitudesServicio.id });

  return { id: fila!.id, prohibido, total, enviarPorWhatsapp: !prohibido && total === 0 };
}

/** Texto del lugar para el mensaje al proveedor: «la localidad Suba» o «la ubicación Calle 80 # 20-30». */
export function lugarDeSolicitud(s: { localidad: string | null; direccion: string | null; lat: number | null; lng: number | null }): string | null {
  if (s.direccion) return `la ubicación ${s.direccion}`;
  if (s.lat != null && s.lng != null) return `la ubicación https://maps.google.com/?q=${s.lat},${s.lng}`;
  return s.localidad ? `la localidad ${s.localidad}` : null;
}

/** B7 · Solicitudes para el administrador, con los contactos (y el mensaje exacto) que cada una generó. */
export async function listarSolicitudes(f: { estado?: string; sinResultado?: boolean; q?: string }, limite = 200) {
  const condiciones = [
    f.estado === "nueva" || f.estado === "avisada" ? eq(solicitudesServicio.estado, f.estado) : undefined,
    f.sinResultado ? eq(solicitudesServicio.resultados, 0) : undefined,
    f.q?.trim() ? sql`(${solicitudesServicio.nombre} ILIKE ${`%${f.q.trim()}%`} OR ${solicitudesServicio.whatsapp} LIKE ${`%${f.q.replace(/\D/g, "") || "~"}%`} OR ${solicitudesServicio.textoLibre} ILIKE ${`%${f.q.trim()}%`})` : undefined,
  ].filter((c) => c !== undefined);

  const filas = await db
    .select({
      id: solicitudesServicio.id, creada: solicitudesServicio.createdAt, estado: solicitudesServicio.estado, nombre: solicitudesServicio.nombre,
      whatsapp: solicitudesServicio.whatsapp, texto: solicitudesServicio.textoLibre, categoria: categorias.nombre, direccion: solicitudesServicio.direccion,
      localidad: localidades.nombre, lat: solicitudesServicio.lat, lng: solicitudesServicio.lng, resultados: solicitudesServicio.resultados, origen: solicitudesServicio.origenBanner,
      version: solicitudesServicio.consentimientoVersion, demanda: solicitudesServicio.cuentaComoDemanda,
    })
    .from(solicitudesServicio)
    .leftJoin(categorias, eq(categorias.id, solicitudesServicio.categoriaId))
    .leftJoin(localidades, eq(localidades.id, solicitudesServicio.localidadId))
    .where(and(...condiciones))
    .orderBy(sql`${solicitudesServicio.createdAt} DESC`)
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
      localidad: localidades.nombre, direccion: solicitudesServicio.direccion, lat: solicitudesServicio.lat, lng: solicitudesServicio.lng,
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
    categoria: s.categoria,
    lugar: lugarDeSolicitud(s),
    punto: s.lat != null && s.lng != null && !s.localidad ? { lat: s.lat, lng: s.lng } : null,
    texto: s.texto ?? (s.categoria ? `Busco ${s.categoria.toLowerCase()}` : "Busco un servicio"),
  };
}
