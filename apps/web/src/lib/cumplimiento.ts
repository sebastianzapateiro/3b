/**
 * B6 · Cumplimiento: reclamos de consumo (Ley 1480), solicitudes de datos (Ley 1581) y políticas vigentes.
 * Los plazos se cuentan en días hábiles con los festivos de Colombia.
 */
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema, consultar } from "@las3b/db";
import { diasHabilesEntre } from "@las3b/shared";

const { mensajesContacto, reclamos, solicitudesDatos, proveedores, user, politicas, festivos, contactos, resenas, servicios } = schema;

export const ETIQUETA_SOLICITUD = { consulta: "Consulta de datos", rectificacion: "Corrección de datos", supresion: "Supresión de datos", exportacion: "Copia de datos" } as const;
export const BANDEJAS = ["todo", "reclamos", "datos", "mensajes", "politicas"] as const;
export type Bandeja = (typeof BANDEJAS)[number];

export type FilaTramite = {
  clase: "reclamo" | "datos";
  id: string;
  titulo: string;
  ley: string;
  solicitante: string;
  sobre: string;
  creado: Date;
  limite: string;
  estado: string;
  totalDias: number;
  usadosDias: number;
  restantes: number;
};

async function festivosManuales() {
  return new Set((await db.select({ f: festivos.fecha }).from(festivos)).map((x) => String(x.f)));
}

function plazo(creado: Date, limite: string, extra: Set<string>) {
  const fin = new Date(`${limite}T00:00:00Z`);
  const total = Math.max(1, diasHabilesEntre(creado, fin, extra));
  const usados = Math.min(total, diasHabilesEntre(creado, new Date(), extra));
  return { totalDias: total, usadosDias: usados, restantes: Math.max(0, total - usados) };
}

export async function bandejaCumplimiento(bandeja: Bandeja): Promise<FilaTramite[]> {
  const extra = await festivosManuales();
  const filas: FilaTramite[] = [];

  if (bandeja !== "datos") {
    const lista = await db
      .select({ id: reclamos.id, nombre: reclamos.nombreReclamante, estado: reclamos.estado, limite: reclamos.fechaLimite, creado: reclamos.createdAt, proveedor: proveedores.nombrePublico })
      .from(reclamos)
      .innerJoin(proveedores, eq(proveedores.id, reclamos.proveedorId))
      .where(inArray(reclamos.estado, ["abierto", "en_proceso"]));
    for (const r of lista) filas.push({ clase: "reclamo", id: r.id, titulo: "Reclamo de consumo", ley: "Ley 1480", solicitante: r.nombre, sobre: r.proveedor, creado: r.creado, limite: String(r.limite), estado: r.estado, ...plazo(r.creado, String(r.limite), extra) });
  }
  if (bandeja !== "reclamos") {
    const lista = await db
      .select({ id: solicitudesDatos.id, tipo: solicitudesDatos.tipo, estado: solicitudesDatos.estado, limite: solicitudesDatos.fechaLimite, creado: solicitudesDatos.createdAt, nombre: user.name })
      .from(solicitudesDatos)
      .innerJoin(user, eq(user.id, solicitudesDatos.usuarioId))
      .where(inArray(solicitudesDatos.estado, ["abierto", "en_proceso"]));
    for (const s of lista) filas.push({ clase: "datos", id: s.id, titulo: ETIQUETA_SOLICITUD[s.tipo], ley: "Ley 1581", solicitante: s.nombre, sobre: "Su propia cuenta", creado: s.creado, limite: String(s.limite), estado: s.estado, ...plazo(s.creado, String(s.limite), extra) });
  }
  return filas.sort((a, b) => a.restantes - b.restantes || a.creado.getTime() - b.creado.getTime());
}

export async function contarAbiertos() {
  const [r] = (await consultar(sql`SELECT (SELECT count(*)::int FROM reclamos WHERE estado IN ('abierto','en_proceso')) + (SELECT count(*)::int FROM solicitudes_datos WHERE estado IN ('abierto','en_proceso')) + (SELECT count(*)::int FROM mensajes_contacto WHERE estado = 'nuevo') AS n`)) as unknown as { n: number }[];
  return r?.n ?? 0;
}

export async function detalleReclamo(id: string) {
  const [r] = await db.select().from(reclamos).where(eq(reclamos.id, id)).limit(1);
  if (!r) return null;
  const [p] = await db.select({ id: proveedores.id, nombre: proveedores.nombrePublico, slug: proveedores.slug, usuarioId: proveedores.usuarioId }).from(proveedores).where(eq(proveedores.id, r.proveedorId)).limit(1);
  const [cont] = await db.select({ n: sql<number>`count(*)::int` }).from(contactos).where(eq(contactos.proveedorId, r.proveedorId));
  const [res] = await db.select({ n: sql<number>`count(*)::int` }).from(resenas).where(eq(resenas.proveedorId, r.proveedorId));
  const [prev] = await db.select({ n: sql<number>`count(*)::int` }).from(reclamos).where(eq(reclamos.proveedorId, r.proveedorId));
  let servicio: { codigo: string; llegada: Date } | null = null;
  if (r.codigoServicio) {
    const [s] = await db.select({ codigo: servicios.codigo, llegada: servicios.fechaLlegada }).from(servicios).where(eq(servicios.codigo, r.codigoServicio)).limit(1);
    servicio = s ?? null;
  }
  return { reclamo: r, proveedor: p ?? null, contactos: cont?.n ?? 0, resenas: res?.n ?? 0, reclamosPrevios: Math.max(0, (prev?.n ?? 1) - 1), servicio };
}

export async function detalleSolicitud(id: string) {
  const [s] = await db
    .select({ id: solicitudesDatos.id, tipo: solicitudesDatos.tipo, detalle: solicitudesDatos.detalle, estado: solicitudesDatos.estado, limite: solicitudesDatos.fechaLimite, creado: solicitudesDatos.createdAt, usuarioId: solicitudesDatos.usuarioId, nombre: user.name, correo: user.email })
    .from(solicitudesDatos)
    .innerJoin(user, eq(user.id, solicitudesDatos.usuarioId))
    .where(eq(solicitudesDatos.id, id))
    .limit(1);
  return s ?? null;
}

/** Última versión de cada política. */
export async function politicasVigentes() {
  const todas = await db.select({ tipo: politicas.tipo, version: politicas.version, desde: politicas.vigenteDesde }).from(politicas).orderBy(desc(politicas.vigenteDesde));
  const vistas = new Set<string>();
  return todas.filter((p) => (vistas.has(p.tipo) ? false : (vistas.add(p.tipo), true)));
}

/** Mensajes del formulario de /contacto (los nuevos primero). */
export async function listarMensajes() {
  return db.select().from(mensajesContacto).orderBy(sql`(${mensajesContacto.estado} = 'nuevo') DESC`, desc(mensajesContacto.createdAt)).limit(100);
}
