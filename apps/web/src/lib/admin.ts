/**
 * B1, B2, B4, B5, B7 · Consultas del backoffice: tablero, cola de aprobación, revisión, usuarios y catálogo.
 * Solo se usa desde páginas protegidas por `exigirBackoffice`.
 * Los datos privados (documento, dirección, fecha de nacimiento) se devuelven enmascarados.
 */
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { proveedores, proveedorCategorias, proveedorLocalidades, proveedorInsignias, categorias, localidades, documentos, insignias, user, usuarioRoles, auditoria, terminosBusqueda } = schema;

const filas = <T>(r: unknown) => r as T[];

/* ───────────── Tablero (BO_Tablero) ───────────── */

export type RangoTablero = "7" | "30" | "mes";

function desdeRango(rango: RangoTablero) {
  if (rango === "mes") return sql`date_trunc('month', now())`;
  return sql`now() - make_interval(days => ${Number(rango)})`;
}

export async function datosTablero(rango: RangoTablero) {
  const desde = desdeRango(rango);

  const [pend] = filas<{ n: number; antiguo: Date | null }>(
    await db.execute(sql`SELECT count(*)::int AS n, min(created_at) AS antiguo FROM proveedores WHERE estado = 'pendiente'`),
  );
  const [recl] = filas<{ n: number; pronto: number }>(
    await db.execute(sql`
      SELECT count(*)::int AS n, count(*) FILTER (WHERE fecha_limite <= current_date + 2)::int AS pronto
      FROM (
        SELECT fecha_limite FROM reclamos WHERE estado IN ('abierto','en_proceso')
        UNION ALL
        SELECT fecha_limite FROM solicitudes_datos WHERE estado IN ('abierto','en_proceso')
      ) t`),
  );
  const [cont] = filas<{ n: number }>(await db.execute(sql`SELECT count(*)::int AS n FROM contactos WHERE created_at >= ${desde}`));
  const [res] = filas<{ n: number }>(await db.execute(sql`SELECT count(*)::int AS n FROM resenas WHERE created_at >= ${desde}`));

  const porCategoria = filas<{ nombre: string; n: number }>(
    await db.execute(sql`
      SELECT coalesce(p.nombre, c.nombre) AS nombre, count(*)::int AS n
      FROM contactos k JOIN categorias c ON c.id = k.categoria_id LEFT JOIN categorias p ON p.id = c.padre_id
      WHERE k.created_at >= ${desde}
      GROUP BY 1 ORDER BY 2 DESC`),
  );
  const porLocalidad = filas<{ nombre: string; contactos: number; activos: number }>(
    await db.execute(sql`
      SELECT l.nombre,
             count(k.id)::int AS contactos,
             (SELECT count(*)::int FROM proveedor_localidades pl JOIN proveedores pr ON pr.id = pl.proveedor_id
               WHERE pl.localidad_id = l.id AND pr.estado IN ('aprobado','en_revision')) AS activos
      FROM localidades l JOIN contactos k ON k.localidad_id = l.id AND k.created_at >= ${desde}
      GROUP BY l.id, l.nombre ORDER BY 2 DESC LIMIT 6`),
  );
  const estados = filas<{ estado: string; n: number }>(
    await db.execute(sql`SELECT estado::text AS estado, count(*)::int AS n FROM proveedores GROUP BY 1`),
  );

  const [menores] = filas<{ n: number }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM proveedor_insignias pi JOIN insignias i ON i.id = pi.insignia_id
      WHERE i.clave = 'apto_menores' AND pi.vence BETWEEN current_date AND current_date + 15`),
  );
  const [rut] = filas<{ n: number }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM proveedores
      WHERE segmento = 'independiente_sin_rut' AND estado IN ('aprobado','en_revision')
        AND rut_fecha_limite BETWEEN current_date AND current_date + 5`),
  );
  const [masivo] = filas<{ n: number }>(
    await db.execute(sql`
      SELECT coalesce(max(c), 0)::int AS n FROM (
        SELECT count(*) AS c FROM auditoria WHERE accion = 'documento_abierto' AND created_at >= now() - interval '1 hour' GROUP BY actor_id
      ) t`),
  );

  const demanda = filas<{ oficio: string; localidad: string | null; n: number; conWhatsapp: number }>(
    await db.execute(sql`
      SELECT coalesce(c.nombre, nullif(trim(s.texto_libre), ''), 'Sin especificar') AS oficio, l.nombre AS localidad,
             count(*)::int AS n, count(s.whatsapp)::int AS "conWhatsapp"
      FROM solicitudes_servicio s
      LEFT JOIN categorias c ON c.slug = s.oficio_slug
      LEFT JOIN localidades l ON l.id = s.localidad_id
      WHERE s.cuenta_como_demanda AND s.created_at >= ${desde}
      GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`),
  );

  const dias = pend?.antiguo ? Math.floor((Date.now() - new Date(pend.antiguo).getTime()) / 86_400_000) : 0;
  return {
    pendientes: pend?.n ?? 0,
    diasMasAntiguo: dias,
    reclamosAbiertos: recl?.n ?? 0,
    reclamosPronto: recl?.pronto ?? 0,
    contactos: cont?.n ?? 0,
    porcentajeResena: cont?.n ? Math.round(((res?.n ?? 0) / cont.n) * 100) : 0,
    porCategoria,
    porLocalidad,
    demanda,
    estados: Object.fromEntries(estados.map((e) => [e.estado, e.n])) as Record<string, number>,
    alertas: { reclamosPronto: recl?.pronto ?? 0, menoresPorVencer: menores?.n ?? 0, rutPorVencer: rut?.n ?? 0, documentosEnUnaHora: masivo?.n ?? 0 },
  };
}

/** Número que va en la insignia amarilla de «Aprobaciones» en el menú. */
export async function totalPendientes() {
  const [r] = filas<{ n: number }>(await db.execute(sql`SELECT count(*)::int AS n FROM proveedores WHERE estado = 'pendiente'`));
  return r?.n ?? 0;
}

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
    await db.execute(sql`
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
    const requisitos: { texto: string; ok: boolean }[] = [
      { texto: "Cédula 2 caras", ok: tipos.has("documento_frente") && tipos.has("documento_reverso") },
    ];
    if (b.segmento === "empresa") requisitos.push({ texto: "Cámara de comercio", ok: tipos.has("camara_comercio") });
    if (b.segmento === "independiente_con_rut" || b.segmento === "empresa" || misCats.some((c) => c.rut))
      requisitos.push({ texto: "RUT", ok: tipos.has("rut") });
    if (misCats.some((c) => c.matricula)) requisitos.push({ texto: "Matrícula", ok: tipos.has("matricula") });
    if (misCats.some((c) => c.menores)) requisitos.push({ texto: "Ley 1918 firmada", ok: tipos.has("autorizacion_ley_1918") });
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
    estado: p.estado,
    nombre: p.nombrePublico,
    slug: p.slug,
    segmento: p.segmento,
    presentacion: p.presentacion,
    emiteFactura: Boolean(p.emiteFactura),
    rutFechaLimite: p.rutFechaLimite,
    creado: p.createdAt,
    tipoDocumento: p.tipoDocumento,
    // El documento está cifrado: solo se muestra una máscara; la lectura completa se audita aparte.
    documentoMascara: doc ? "••••••••" : "—",
    fechaNacimiento: nacimiento ? nacimiento.toLocaleDateString("es-CO", { timeZone: "UTC" }) : null,
    mayorDeEdad: edad !== null ? edad >= 18 : null,
    direccion: p.direccionNotificaciones,
    whatsappMascara: tel ? `+${tel.slice(0, 2)} ${tel.slice(2, 5)} ••• ••${tel.slice(-2)}` : "—",
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
  const ultimo = await db.execute(sql`SELECT user_id AS id, max(updated_at) AS ultimo FROM session WHERE user_id IN (${sql.join(lista.map((l) => sql`${l.id}`), sql`, `)}) GROUP BY user_id`);
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
    await db.execute(sql`SELECT categoria_id AS id, count(*)::int AS n FROM proveedor_categorias GROUP BY 1`),
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
  const [conteo] = filas<{ n: number }>(await db.execute(sql`SELECT count(*)::int AS n FROM proveedor_categorias WHERE categoria_id = ${id}`));
  return { ...c, terminos, proveedores: conteo?.n ?? 0 };
}

export async function listarLocalidades() {
  const locs = await db.select().from(localidades).orderBy(asc(localidades.numero));
  const barrios = filas<{ id: number; n: number }>(await db.execute(sql`SELECT localidad_id AS id, count(*)::int AS n FROM barrios GROUP BY 1`));
  const mapa = new Map(barrios.map((b) => [b.id, b.n]));
  return locs.map((l) => ({ ...l, barrios: mapa.get(l.id) ?? 0 }));
}
