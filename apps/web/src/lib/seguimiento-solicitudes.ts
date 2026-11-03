/**
 * B7 · Seguimiento de las solicitudes de clientes que dejaron su WhatsApp (sobre todo las que no tenían proveedor cerca).
 * Estados, bitácora (`solicitud_seguimiento`, solo se agrega), proveedores sugeridos y vencimiento de la próxima acción.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { LOCALIDADES_VECINAS, type LocalidadSlug } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { buscarProveedores } from "@/lib/busqueda";
import { hoyBogota } from "@/lib/seguimiento";

const { solicitudesServicio, solicitudSeguimiento, proveedores, user } = schema;

export const ESTADOS_SOLICITUD = [
  ["nueva", "Nueva", "amarillo"],
  ["en_gestion", "En gestión", "amarillo"],
  ["proveedor_contactado", "Proveedor contactado", "verde"],
  ["avisada", "Cliente avisado", "verde"],
  ["atendida", "Atendida", "gris"],
  ["sin_proveedor", "Sin proveedor", "rojo"],
  ["descartada", "Descartada", "gris"],
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number][0];
export const VALORES_ESTADO = ESTADOS_SOLICITUD.map(([v]) => v) as [EstadoSolicitud, ...EstadoSolicitud[]];
export const datosEstado = (e: string) => ESTADOS_SOLICITUD.find(([v]) => v === e) ?? ESTADOS_SOLICITUD[0];

/** Casos cerrados: ya no necesitan acción. */
export const ESTADOS_CERRADOS: readonly string[] = ["atendida", "sin_proveedor", "descartada"];
const ESTADOS_AVANZADOS: readonly string[] = ["avisada", ...ESTADOS_CERRADOS];

export type TipoEvento = "nota" | "estado" | "proveedor" | "cliente" | "asignacion";

/** Agrega un evento a la bitácora y, si corresponde, mueve la solicitud de estado. */
export async function registrarEvento(a: { solicitudId: string; autorId: string; tipo: TipoEvento; canal?: string; proveedorId?: string; estadoNuevo?: EstadoSolicitud; nota?: string }) {
  const [actual] = await db.select({ estado: solicitudesServicio.estado }).from(solicitudesServicio).where(eq(solicitudesServicio.id, a.solicitudId)).limit(1);
  if (!actual) return null;
  // Escribirle a un proveedor o al cliente avanza el caso, pero nunca lo devuelve ni lo reabre.
  let estado: EstadoSolicitud | undefined = a.estadoNuevo;
  if (!estado && a.tipo === "proveedor" && !ESTADOS_AVANZADOS.includes(actual.estado)) estado = "proveedor_contactado";
  if (!estado && a.tipo === "cliente" && !ESTADOS_CERRADOS.includes(actual.estado)) estado = "avisada";

  await db.insert(solicitudSeguimiento).values({
    solicitudId: a.solicitudId, autorId: a.autorId, tipo: a.tipo, canal: a.canal ?? null, proveedorId: a.proveedorId ?? null,
    estadoNuevo: estado && estado !== actual.estado ? estado : null, nota: a.nota?.trim() || null,
  });
  await db.update(solicitudesServicio).set({ ...(estado ? { estado } : {}), actualizadaEn: new Date() }).where(eq(solicitudesServicio.id, a.solicitudId));
  return estado ?? actual.estado;
}

function consultarHistorial(ids: string[]) {
  return db
    .select({
      solicitudId: solicitudSeguimiento.solicitudId, tipo: solicitudSeguimiento.tipo, canal: solicitudSeguimiento.canal, estadoNuevo: solicitudSeguimiento.estadoNuevo,
      nota: solicitudSeguimiento.nota, cuando: solicitudSeguimiento.createdAt, autor: user.name, proveedor: proveedores.nombrePublico,
    })
    .from(solicitudSeguimiento)
    .innerJoin(user, eq(user.id, solicitudSeguimiento.autorId))
    .leftJoin(proveedores, eq(proveedores.id, solicitudSeguimiento.proveedorId))
    .where(inArray(solicitudSeguimiento.solicitudId, ids))
    .orderBy(desc(solicitudSeguimiento.createdAt));
}

export type EventoHistorial = Awaited<ReturnType<typeof consultarHistorial>>[number];

/** Bitácora de varias solicitudes, de la más reciente a la más antigua. */
export async function historialDe(ids: string[]) {
  const mapa = new Map<string, EventoHistorial[]>();
  if (ids.length === 0) return mapa;
  for (const f of await consultarHistorial(ids)) mapa.set(f.solicitudId, [...(mapa.get(f.solicitudId) ?? []), f]);
  return mapa;
}

export type ProveedorSugerido = { id: string; slug: string; nombre: string; whatsapp: string; zonas: string[]; cerca: boolean };

/**
 * Proveedores a quienes pedirles que contacten al cliente: del mismo oficio, en su localidad y las vecinas
 * (o del más cercano al más lejano si dio ubicación exacta). Si no hay ninguno cerca, los mejor calificados del oficio en Bogotá.
 */
export async function sugerirProveedores(s: { categoriaSlug: string | null; texto: string | null; localidadSlug: string | null; punto: { lat: number; lng: number } | null }, limite = 4): Promise<ProveedorSugerido[]> {
  const base = s.categoriaSlug ? { categoria: s.categoriaSlug } : s.texto ? { q: s.texto } : null;
  if (!base) return [];
  const vecinas = s.localidadSlug && s.localidadSlug in LOCALIDADES_VECINAS ? LOCALIDADES_VECINAS[s.localidadSlug as LocalidadSlug] : [];
  const cerca = await buscarProveedores(s.punto ? { ...base, punto: s.punto } : s.localidadSlug ? { ...base, localidad: s.localidadSlug, tambien: [...vecinas] } : base);
  const r = cerca.items.length > 0 ? cerca : await buscarProveedores(base);
  const items = r.items.slice(0, limite);
  if (items.length === 0) return [];
  const datos = await db.select({ id: proveedores.id, slug: proveedores.slug, whatsapp: proveedores.whatsapp }).from(proveedores).where(inArray(proveedores.slug, items.map((i) => i.slug)));
  return items.flatMap((i) => {
    const d = datos.find((x) => x.slug === i.slug);
    return d?.whatsapp ? [{ id: d.id, slug: i.slug, nombre: i.nombre, whatsapp: d.whatsapp, zonas: i.localidades, cerca: cerca.items.length > 0 }] : [];
  });
}

/** Casos con contacto por estado y los abiertos cuya próxima acción ya venció, para las pestañas del tablero. */
export async function conteosSeguimiento(responsableId?: string) {
  const conContacto = sql`${solicitudesServicio.whatsapp} IS NOT NULL`;
  const filas = await db.select({ estado: solicitudesServicio.estado, n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(conContacto).groupBy(solicitudesServicio.estado);
  const abiertas = sql`${solicitudesServicio.estado} NOT IN ('atendida','sin_proveedor','descartada')`;
  const [vencidas] = await db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(conContacto, abiertas, sql`${solicitudesServicio.proximaAccionEn} <= ${hoyBogota()}`));
  const [mios] = responsableId
    ? await db.select({ n: sql<number>`count(*)::int` }).from(solicitudesServicio).where(and(conContacto, abiertas, eq(solicitudesServicio.responsableId, responsableId)))
    : [{ n: 0 }];
  return { porEstado: Object.fromEntries(filas.map((f) => [f.estado, f.n])) as Record<string, number>, vencidas: vencidas?.n ?? 0, mios: mios?.n ?? 0 };
}
