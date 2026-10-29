/** P6 / B6 / B8 · Políticas versionadas, consentimientos, reclamos, solicitudes de datos y auditoría. */
import { boolean, date, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { proveedores } from "./proveedores";

export const tipoPoliticaEnum = pgEnum("tipo_politica", [
  "terminos_compradores", "terminos_proveedores", "tratamiento_datos", "aviso_privacidad", "cookies", "resenas", "autorizacion_ley_1918", "declaracion_servicios_no_permitidos",
]);

export const politicas = pgTable("politicas", {
  id: serial().primaryKey(),
  tipo: tipoPoliticaEnum().notNull(),
  version: text().notNull(),
  contenidoMd: text().notNull(),
  esencial: boolean().notNull().default(false),
  vigenteDesde: timestamp({ withTimezone: true }).notNull(),
});

/** RF-19: casilla no premarcada; se guarda versión, fecha e IP. */
export const consentimientos = pgTable("consentimientos", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: text().notNull().references(() => user.id),
  politicaId: integer().notNull().references(() => politicas.id),
  ip: text(),
  userAgent: text(),
  aceptadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const estadoTramiteEnum = pgEnum("estado_tramite", ["abierto", "en_proceso", "respondido", "cerrado"]);

/** CU-10 / CU-74: reclamo de consumo (art. 53, Ley 1480). */
export const reclamos = pgTable("reclamos", {
  id: uuid().primaryKey().defaultRandom(),
  proveedorId: uuid().notNull().references(() => proveedores.id),
  reclamanteId: text().references(() => user.id),
  nombreReclamante: text().notNull(),
  correoReclamante: text().notNull(),
  codigoServicio: text(),
  descripcion: text().notNull(),
  solicitaDatosProveedor: boolean().notNull().default(false),
  datosEntregadosEn: timestamp({ withTimezone: true }),
  estado: estadoTramiteEnum().notNull().default("abierto"),
  fechaLimite: date().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tipoSolicitudDatosEnum = pgEnum("tipo_solicitud_datos", ["consulta", "rectificacion", "supresion", "exportacion"]);

/** CU-26 / CU-75 (Ley 1581): 10 días hábiles consultas, 15 reclamos. */
export const solicitudesDatos = pgTable("solicitudes_datos", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: text().notNull().references(() => user.id),
  tipo: tipoSolicitudDatosEnum().notNull(),
  detalle: text(),
  estado: estadoTramiteEnum().notNull().default("abierto"),
  fechaLimite: date().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** CU-78: solo inserciones. Revocar UPDATE/DELETE a nivel de base en la migración. */
export const auditoria = pgTable("auditoria", {
  id: uuid().primaryKey().defaultRandom(),
  actorId: text().references(() => user.id),
  rol: text(),
  accion: text().notNull(),
  objetoTipo: text(),
  objetoId: text(),
  resultado: text(),
  motivo: text(),
  ip: text(),
  dispositivo: text(),
  metadatos: jsonb(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** CU-92: festivos de Colombia para contar días hábiles. */
export const festivos = pgTable("festivos", {
  fecha: date().primaryKey(),
  nombre: text().notNull(),
});

/** CU-79: parámetros configurables (plazos, límites, días de recordatorio). */
export const configuracion = pgTable("configuracion", {
  clave: text().primaryKey(),
  valor: jsonb().notNull(),
  actualizadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
