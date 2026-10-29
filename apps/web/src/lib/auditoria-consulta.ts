/** B8 · Consulta del registro de auditoría (solo lectura) y alertas de uso anómalo. */
import { and, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@las3b/db";

const { auditoria, user } = schema;

export const FILTROS_ACCION: Record<string, { texto: string; acciones?: string[]; prefijo?: string }> = {
  todas: { texto: "Todas las acciones" },
  documento: { texto: "Abrir documento", acciones: ["documento_abierto"] },
  decision: { texto: "Aprobar / rechazar", acciones: ["proveedor_aprobado", "proveedor_rechazado", "alta_asistida"] },
  moderar: { texto: "Moderar", prefijo: "moderacion_" },
  rol: { texto: "Cambiar rol", acciones: ["roles_actualizados", "admin_creado_por_script", "usuario_creado"] },
  suspender: { texto: "Suspender", acciones: ["usuario_suspendido", "aviso_suspension", "dos_factor_restablecido"] },
  art53: { texto: "Entregar datos (art. 53)", acciones: ["entregar_datos_art53"] },
  sesion: { texto: "Inicio de sesión", prefijo: "inicio_de_sesion" },
  parametros: { texto: "Parámetros y exportes", acciones: ["parametros_actualizados", "auditoria_exportada", "politica_publicada"] },
};

export const ETIQUETA_ACCION: Record<string, string> = {
  documento_abierto: "Abrir documento",
  proveedor_aprobado: "Aprobar proveedor",
  proveedor_rechazado: "Rechazar proveedor",
  alta_asistida: "Alta asistida",
  roles_actualizados: "Asignar rol",
  usuario_creado: "Crear usuario",
  usuario_suspendido: "Suspender cuenta",
  aviso_suspension: "Aviso de suspensión",
  dos_factor_restablecido: "Restablecer 2FA",
  entregar_datos_art53: "Entregar datos (art. 53)",
  reclamo_respondido: "Responder reclamo",
  moderacion_mantener: "Mantener contenido",
  moderacion_ocultar: "Ocultar contenido",
  moderacion_eliminar: "Eliminar contenido",
  ocultar_provisional: "Ocultar provisionalmente",
  retiro_atendido: "Atender retiro",
  categoria_actualizada: "Editar categoría",
  parametros_actualizados: "Cambiar parámetros",
  auditoria_exportada: "Exportar auditoría",
  politica_publicada: "Publicar política",
  inicio_de_sesion: "Inicio de sesión",
};

export type FiltroAuditoria = { usuario?: string; accion?: string; desde?: string };

function condiciones(f: FiltroAuditoria): SQL | undefined {
  const c: SQL[] = [];
  if (f.usuario?.trim()) {
    const q = `%${f.usuario.trim()}%`;
    c.push(or(ilike(user.email, q), ilike(user.name, q))!);
  }
  const a = FILTROS_ACCION[f.accion ?? "todas"];
  if (a?.acciones) c.push(sql`${auditoria.accion} IN (${sql.join(a.acciones.map((x) => sql`${x}`), sql`, `)})`);
  if (a?.prefijo) c.push(ilike(auditoria.accion, `${a.prefijo}%`));
  if (f.desde && /^\d{4}-\d{2}-\d{2}$/.test(f.desde)) c.push(gte(auditoria.createdAt, new Date(`${f.desde}T00:00:00-05:00`)));
  return c.length ? and(...c) : undefined;
}

export async function listarAuditoria(f: FiltroAuditoria, limite = 200) {
  return db
    .select({ id: auditoria.id, fecha: auditoria.createdAt, accion: auditoria.accion, rol: auditoria.rol, objetoTipo: auditoria.objetoTipo, objetoId: auditoria.objetoId, resultado: auditoria.resultado, motivo: auditoria.motivo, ip: auditoria.ip, quien: user.name, correo: user.email })
    .from(auditoria)
    .leftJoin(user, eq(user.id, auditoria.actorId))
    .where(condiciones(f))
    .orderBy(desc(auditoria.createdAt))
    .limit(limite);
}

/** Quien abrió más documentos de los permitidos por hora en las últimas 24 h (umbral: 30). */
export async function alertaDocumentos(umbral = 30) {
  const r = (await db.execute(sql`
    SELECT u.name AS nombre, count(*)::int AS n, min(a.created_at) AS desde, max(a.created_at) AS hasta
    FROM auditoria a LEFT JOIN "user" u ON u.id = a.actor_id
    WHERE a.accion = 'documento_abierto' AND a.created_at >= now() - interval '24 hours'
    GROUP BY a.actor_id, u.name, date_trunc('hour', a.created_at)
    HAVING count(*) > ${umbral}
    ORDER BY n DESC LIMIT 1`)) as unknown as { nombre: string | null; n: number; desde: Date; hasta: Date }[];
  return r[0] ?? null;
}
