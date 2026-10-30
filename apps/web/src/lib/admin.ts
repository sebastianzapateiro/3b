/**
 * B1, B2, B4, B5, B7 · Consultas del backoffice: tablero, cola de aprobación, revisión, usuarios y catálogo.
 * Solo se usa desde páginas protegidas por `exigirBackoffice`.
 * Los datos privados (documento, dirección, fecha de nacimiento) se devuelven enmascarados.
 */
import { cache } from "react";
import { documentosExigidos } from "@/lib/documentos";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, schema, consultar } from "@las3b/db";

const { proveedores, proveedorCategorias, proveedorLocalidades, proveedorInsignias, categorias, localidades, documentos, insignias, user, usuarioRoles, auditoria, terminosBusqueda } = schema;

const filas = <T>(r: unknown) => r as T[];

/* ───────────── Tablero (BO_Tablero) ───────────── */

export type RangoTablero = "7" | "30" | "mes";

function desdeRango(rango: RangoTablero) {
  if (rango === "mes") return sql`date_trunc('month', now())`;
  return sql`now() - make_interval(days => ${Number(rango)})`;
}

type FilaTablero = {
  pendientes: number;
  antiguo: Date | null;
  reclamos: number;
  reclamos_pronto: number;
  contactos: number;
  resenas: number;
  menores: number;
  rut: number;
  masivo: number;
  por_categoria: { nombre: string; n: number }[] | null;
  por_localidad: { nombre: string; contactos: number; activos: number }[] | null;
  estados: Record<string, number> | null;
  demanda: { oficio: string; localidad: string | null; n: number; conWhatsapp: number }[] | null;
};

/** Todo el tablero en una sola consulta: la base está lejos (~170 ms por viaje) y antes eran 11 en serie. */
export async function datosTablero(rango: RangoTablero) {
  const desde = desdeRango(rango);

  const [t] = await consultar<FilaTablero>(sql`
    SELECT
      (SELECT count(*)::int FROM proveedores WHERE estado = 'pendiente') AS pendientes,
      (SELECT min(created_at) FROM proveedores WHERE estado = 'pendiente') AS antiguo,
      r.n AS reclamos, r.pronto AS reclamos_pronto,
      (SELECT count(*)::int FROM contactos WHERE created_at >= ${desde}) AS contactos,
      (SELECT count(*)::int FROM resenas WHERE created_at >= ${desde}) AS resenas,
      (SELECT count(*)::int FROM proveedor_insignias pi JOIN insignias i ON i.id = pi.insignia_id
        WHERE i.clave = 'apto_menores' AND pi.vence BETWEEN current_date AND current_date + 15) AS menores,
      (SELECT count(*)::int FROM proveedores
        WHERE segmento = 'independiente_sin_rut' AND estado IN ('aprobado','en_revision')
          AND rut_fecha_limite BETWEEN current_date AND current_date + 5) AS rut,
      (SELECT coalesce(max(c), 0)::int FROM (
        SELECT count(*) AS c FROM auditoria WHERE accion = 'documento_abierto' AND created_at >= now() - interval '1 hour' GROUP BY actor_id
      ) m) AS masivo,
      (SELECT json_agg(x) FROM (
        SELECT coalesce(p.nombre, c.nombre) AS nombre, count(*)::int AS n
        FROM contactos k JOIN categorias c ON c.id = k.categoria_id LEFT JOIN categorias p ON p.id = c.padre_id
        WHERE k.created_at >= ${desde}
        GROUP BY 1 ORDER BY 2 DESC
      ) x) AS por_categoria,
      (SELECT json_agg(x) FROM (
        SELECT l.nombre,
               count(k.id)::int AS contactos,
               (SELECT count(*)::int FROM proveedor_localidades pl JOIN proveedores pr ON pr.id = pl.proveedor_id
                 WHERE pl.localidad_id = l.id AND pr.estado IN ('aprobado','en_revision')) AS activos
        FROM localidades l JOIN contactos k ON k.localidad_id = l.id AND k.created_at >= ${desde}
        GROUP BY l.id, l.nombre ORDER BY 2 DESC LIMIT 6
      ) x) AS por_localidad,
      (SELECT json_object_agg(estado, n) FROM (SELECT estado::text AS estado, count(*)::int AS n FROM proveedores GROUP BY 1) x) AS estados,
      (SELECT json_agg(x) FROM (
        SELECT coalesce(c.nombre, nullif(trim(s.texto_libre), ''), 'Sin especificar') AS oficio, l.nombre AS localidad,
               count(*)::int AS n, count(s.whatsapp)::int AS "conWhatsapp"
        FROM solicitudes_servicio s
        LEFT JOIN categorias c ON c.slug = s.oficio_slug
        LEFT JOIN localidades l ON l.id = s.localidad_id
        WHERE s.cuenta_como_demanda AND s.created_at >= ${desde}
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10
      ) x) AS demanda
    FROM (
      SELECT count(*)::int AS n, count(*) FILTER (WHERE fecha_limite <= current_date + 2)::int AS pronto
      FROM (
        SELECT fecha_limite FROM reclamos WHERE estado IN ('abierto','en_proceso')
        UNION ALL
        SELECT fecha_limite FROM solicitudes_datos WHERE estado IN ('abierto','en_proceso')
      ) u
    ) r`);

  const dias = t?.antiguo ? Math.floor((Date.now() - new Date(t.antiguo).getTime()) / 86_400_000) : 0;
  const contactos = t?.contactos ?? 0;
  return {
    pendientes: t?.pendientes ?? 0,
    diasMasAntiguo: dias,
    reclamosAbiertos: t?.reclamos ?? 0,
    reclamosPronto: t?.reclamos_pronto ?? 0,
    contactos,
    porcentajeResena: contactos ? Math.round(((t?.resenas ?? 0) / contactos) * 100) : 0,
    porCategoria: t?.por_categoria ?? [],
    porLocalidad: t?.por_localidad ?? [],
    demanda: t?.demanda ?? [],
    estados: t?.estados ?? {},
    alertas: { reclamosPronto: t?.reclamos_pronto ?? 0, menoresPorVencer: t?.menores ?? 0, rutPorVencer: t?.rut ?? 0, documentosEnUnaHora: t?.masivo ?? 0 },
  };
}

/**
 * Insignias del menú (aprobaciones, reportes, reclamos y datos) en una sola consulta.
 * Con cache de React: el tablero reutiliza el número de reportes sin volver a consultar.
 */
export const contadoresMenu = cache(async () => {
  try {
    const [r] = await consultar<{ pendientes: number; reportes: number; tramites: number }>(sql`
      SELECT
        (SELECT count(*)::int FROM proveedores WHERE estado = 'pendiente') AS pendientes,
        (SELECT count(DISTINCT (tipo_objeto, objeto_id))::int FROM reportes WHERE NOT resuelto) AS reportes,
        (SELECT count(*)::int FROM reclamos WHERE estado IN ('abierto','en_proceso'))
          + (SELECT count(*)::int FROM solicitudes_datos WHERE estado IN ('abierto','en_proceso'))
          + (SELECT count(*)::int FROM mensajes_contacto WHERE estado = 'nuevo') AS tramites`);
    return { pendientes: r?.pendientes ?? 0, reportes: r?.reportes ?? 0, tramites: r?.tramites ?? 0 };
  } catch {
    return { pendientes: 0, reportes: 0, tramites: 0 };
  }
});

/* ───────────── Cola de aprobación (BO_Aprobaciones) ───────────── */

export const COLAS = ["pendientes", "reputacion", "rut", "insignias"] as const;
export type Cola = (typeof COLAS)[number];

export type FilaCola = {
  id: string;
  nombre: string;
  segmento: string | null;
  categorias: string[];
  localidades: string[];
  requisitos: { texto: string; ok: boolean }[];
  espera: string;
  esperaCritica: boolean;
};

const ETIQUETA_SEGMENTO: Record<string, string> = {
  independiente_sin_rut: "Independiente sin RUT",
  independiente_con_rut: "Independiente con RUT",
  empresa: "Empresa",
};
export const etiquetaSegmento = (s: string | null) => (s ? (ETIQUETA_SEGMENTO[s] ?? s) : "—");

function espera(desde: Date) {
  const horas = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 3_600_000));
  return horas < 48 ? { texto: `${horas} h`, critica: false } : { texto: `${Math.floor(horas / 24)} días`, critica: horas >= 24 * 5 };
}

export async function contarColas(): Promise<Record<Cola, number>> {
  const [r] = filas<Record<Cola, number>>(
    await consultar(sql`
      SELECT
        (SELECT count(*)::int FROM proveedores WHERE estado = 'pendiente') AS pendientes,
        (SELECT count(*)::int FROM proveedores WHERE estado = 'en_revision') AS reputacion,
        (SELECT count(*)::int FROM proveedores WHERE segmento = 'independiente_sin_rut' AND estado IN ('aprobado','en_revision','pausado_por_rut') AND rut_fecha_limite <= current_date + 10) AS rut,
        (SELECT count(*)::int FROM proveedor_insignias WHERE vence <= current_date + 30) AS insignias`),
  );
  return r ?? { pendientes: 0, reputacion: 0, rut: 0, insignias: 0 };
}

export async function listarCola(cola: Cola, f: { q?: string; segmento?: string; menores?: boolean; riesgo?: boolean }): Promise<FilaCola[]> {
  const condiciones = [];
  if (cola === "pendientes") condiciones.push(eq(proveedores.estado, "pendiente"));
  if (cola === "reputacion") condiciones.push(eq(proveedores.estado, "en_revision"));
  if (cola === "rut")
    condiciones.push(sql`${proveedores.segmento} = 'independiente_sin_rut' AND ${proveedores.estado} IN ('aprobado','en_revision','pausado_por_rut') AND ${proveedores.rutFechaLimite} <= current_date + 10`);
  if (cola === "insignias")
    condiciones.push(sql`${proveedores.id} IN (SELECT proveedor_id FROM proveedor_insignias WHERE vence <= current_date + 30)`);

  if (f.segmento && f.segmento in ETIQUETA_SEGMENTO) condiciones.push(sql`${proveedores.segmento} = ${f.segmento}`);
  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`;
    condiciones.push(or(ilike(proveedores.nombrePublico, q), ilike(proveedores.slug, q), ilike(proveedores.whatsapp, q))!);
  }
  if (f.menores)
    condiciones.push(sql`${proveedores.id} IN (SELECT pc.proveedor_id FROM proveedor_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE c.exige_insignia_menores)`);
  if (f.riesgo)
    condiciones.push(sql`${proveedores.id} IN (SELECT pc.proveedor_id FROM proveedor_categorias pc JOIN categorias c ON c.id = pc.categoria_id WHERE c.exige_rut_desde_alta)`);

  const base = await db
    .select({ id: proveedores.id, nombre: proveedores.nombrePublico, segmento: proveedores.segmento, creado: proveedores.createdAt })
    .from(proveedores)
    .where(and(...condiciones))
    .orderBy(asc(proveedores.createdAt))
    .limit(100);
  if (base.length === 0) return [];
  const ids = base.map((b) => b.id);

  const [cats, locs, docs] = await Promise.all([
    db
      .select({ pid: proveedorCategorias.proveedorId, nombre: categorias.nombre, rut: categorias.exigeRutDesdeAlta, matricula: categorias.exigeMatricula, menores: categorias.exigeInsigniaMenores })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(inArray(proveedorCategorias.proveedorId, ids)),
    db
      .select({ pid: proveedorLocalidades.proveedorId, nombre: localidades.nombre })
      .from(proveedorLocalidades)
      .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
      .where(inArray(proveedorLocalidades.proveedorId, ids)),
    db.select({ pid: documentos.proveedorId, tipo: documentos.tipo }).from(documentos).where(inArray(documentos.proveedorId, ids)),
  ]);

  return base.map((b) => {
    const misCats = cats.filter((c) => c.pid === b.id);
    const tipos = new Set(docs.filter((d) => d.pid === b.id).map((d) => d.tipo));
    const requisitos = documentosExigidos(b.segmento, misCats)
      .filter((r) => r.exigido)
      .map((r) => ({ texto: r.nombre, ok: tipos.has(r.tipo) }));
    const e = espera(b.creado);
    return {
      id: b.id,
      nombre: b.nombre,
      segmento: b.segmento,
      categorias: misCats.map((c) => c.nombre),
      localidades: locs.filter((l) => l.pid === b.id).map((l) => l.nombre),
      requisitos,
      espera: e.texto,
      esperaCritica: e.critica,
    };
  });
}

/* ───────────── Revisión (BO_Revision) ───────────── */

export async function obtenerRevision(id: string) {
  const [p] = await db.select().from(proveedores).where(eq(proveedores.id, id)).limit(1);
  if (!p) return null;

  const [cats, locs, docs, insig, servicios, [u]] = await Promise.all([
    db
      .select({ nombre: categorias.nombre, rut: categorias.exigeRutDesdeAlta, matricula: categorias.exigeMatricula, menores: categorias.exigeInsigniaMenores })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(eq(proveedorCategorias.proveedorId, id)),
    db
      .select({ nombre: localidades.nombre })
      .from(proveedorLocalidades)
      .innerJoin(localidades, eq(localidades.id, proveedorLocalidades.localidadId))
      .where(eq(proveedorLocalidades.proveedorId, id)),
    db.select({ id: documentos.id, tipo: documentos.tipo, mime: documentos.mime, bytes: documentos.bytes }).from(documentos).where(eq(documentos.proveedorId, id)),
    db
      .select({ clave: insignias.clave, nombre: insignias.nombre, vence: proveedorInsignias.vence })
      .from(proveedorInsignias)
      .innerJoin(insignias, eq(insignias.id, proveedorInsignias.insigniaId))
      .where(eq(proveedorInsignias.proveedorId, id)),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.serviciosProveedor).where(eq(schema.serviciosProveedor.proveedorId, id)),
    db.select({ correo: user.email, correoVerificado: user.emailVerified }).from(user).where(eq(user.id, p.usuarioId)).limit(1),
  ]);

  const historial = await db
    .select({ accion: auditoria.accion, motivo: auditoria.motivo, creado: auditoria.createdAt })
    .from(auditoria)
    .where(and(eq(auditoria.objetoTipo, "proveedor"), eq(auditoria.objetoId, id)))
    .orderBy(desc(auditoria.createdAt))
    .limit(12);

  const doc = p.documentoCifrado ?? "";
  const nacimiento = p.fechaNacimiento ? new Date(`${p.fechaNacimiento}T00:00:00Z`) : null;
  const edad = nacimiento ? Math.floor((Date.now() - nacimiento.getTime()) / (365.25 * 86_400_000)) : null;
  const tel = p.whatsapp.replace(/\D/g, "");

  return {
    id: p.id,
    usuarioId: p.usuarioId,
    estado: p.estado,
    nombre: p.nombrePublico,
    slug: p.slug,
    segmento: p.segmento,
    presentacion: p.presentacion,
    emiteFactura: Boolean(p.emiteFactura),
    rutFechaLimite: p.rutFechaLimite,
    creado: p.createdAt,
    tipoDocumento: p.tipoDocumento,
    // El documento está cifrado (AES-256-GCM): solo se muestra una máscara; la lectura completa se audita aparte.
    documentoMascara: doc ? "••••••••" : "—",
    fechaNacimiento: nacimiento ? nacimiento.toLocaleDateString("es-CO", { timeZone: "UTC" }) : null,
    mayorDeEdad: edad !== null ? edad >= 18 : null,
    direccion: p.direccionNotificaciones,
    whatsappMascara: tel ? `+${tel.slice(0, 2)} ${tel.slice(2, 5)} ••• ••${tel.slice(-2)}` : "—",
    // Solo para armar el enlace de invitación por WhatsApp; en pantalla se muestra la máscara.
    whatsapp: p.whatsapp,
    correo: u?.correo ?? null,
    correoVerificado: Boolean(u?.correoVerificado),
    categorias: cats,
    localidades: locs.map((l) => l.nombre),
    documentos: docs,
    insignias: insig,
    totalServicios: servicios[0]?.n ?? 0,
    historial,
  };
}

/* ───────────── Usuarios (BO_Usuarios) ───────────── */

export async function listarUsuarios(q?: string) {
  const condicion = q?.trim()
    ? or(ilike(user.email, `%${q.trim()}%`), ilike(user.name, `%${q.trim()}%`), ilike(user.telefono, `%${q.trim()}%`))
    : undefined;
  const lista = await db
    .select({ id: user.id, nombre: user.name, correo: user.email, suspendidoHasta: user.suspendidoHasta, dosFactor: user.twoFactorEnabled, creado: user.createdAt })
    .from(user)
    .where(condicion)
    .orderBy(desc(user.createdAt))
    .limit(50);
  if (lista.length === 0) return [];
  const roles = await db
    .select({ id: usuarioRoles.usuarioId, rol: usuarioRoles.rol })
    .from(usuarioRoles)
    .where(inArray(usuarioRoles.usuarioId, lista.map((l) => l.id)));
  const ultimo = await consultar(sql`SELECT user_id AS id, max(updated_at) AS ultimo FROM session WHERE user_id IN (${sql.join(lista.map((l) => sql`${l.id}`), sql`, `)}) GROUP BY user_id`);
  const mapaUltimo = new Map(filas<{ id: string; ultimo: Date }>(ultimo).map((u) => [u.id, u.ultimo]));
  return lista.map((l) => ({
    ...l,
    roles: roles.filter((r) => r.id === l.id).map((r) => r.rol as string),
    ultimoIngreso: mapaUltimo.get(l.id) ?? null,
  }));
}

/* ───────────── Catálogo (BO_Catalogo) ───────────── */

export async function listarCatalogo() {
  const todas = await db.select().from(categorias).orderBy(asc(categorias.orden), asc(categorias.nombre));
  const conteo = filas<{ id: number; n: number }>(
    await consultar(sql`SELECT categoria_id AS id, count(*)::int AS n FROM proveedor_categorias GROUP BY 1`),
  );
  const mapa = new Map(conteo.map((c) => [c.id, c.n]));
  const padres = todas.filter((c) => c.padreId === null);
  return padres.map((p) => ({
    ...p,
    hijas: todas.filter((c) => c.padreId === p.id).map((h) => ({ ...h, proveedores: mapa.get(h.id) ?? 0 })),
  }));
}

export async function obtenerSubcategoria(id: number) {
  const [c] = await db.select().from(categorias).where(eq(categorias.id, id)).limit(1);
  if (!c) return null;
  const terminos = await db.select({ id: terminosBusqueda.id, termino: terminosBusqueda.termino }).from(terminosBusqueda).where(eq(terminosBusqueda.categoriaId, id)).orderBy(asc(terminosBusqueda.termino));
  const [conteo] = filas<{ n: number }>(await consultar(sql`SELECT count(*)::int AS n FROM proveedor_categorias WHERE categoria_id = ${id}`));
  return { ...c, terminos, proveedores: conteo?.n ?? 0 };
}

export async function listarLocalidades() {
  const locs = await db.select().from(localidades).orderBy(asc(localidades.numero));
  const barrios = filas<{ id: number; n: number }>(await consultar(sql`SELECT localidad_id AS id, count(*)::int AS n FROM barrios GROUP BY 1`));
  const mapa = new Map(barrios.map((b) => [b.id, b.n]));
  return locs.map((l) => ({ ...l, barrios: mapa.get(l.id) ?? 0 }));
}
