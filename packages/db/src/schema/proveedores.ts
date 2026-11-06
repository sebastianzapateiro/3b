/** P3 / B1 / B2 · Proveedores, portafolio, documentos privados e insignias. */
import {
  boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, real, serial, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { categorias, localidades } from "./catalogo";

export const estadoProveedorEnum = pgEnum("estado_proveedor", [
  "borrador", "pendiente", "aprobado", "rechazado", "en_revision", "pausado", "pausado_por_rut", "suspendido",
]);
export const segmentoProveedorEnum = pgEnum("segmento_proveedor", [
  "independiente_sin_rut", "independiente_con_rut", "empresa",
]);
export const tipoDocumentoEnum = pgEnum("tipo_documento", ["cc", "ce", "ppt", "nit"]);
/** B1 · De dónde salió el proveedor (seguimiento interno del equipo; nunca en público). */
export const fuenteOrigenEnum = pgEnum("fuente_origen", ["google_maps", "instagram", "ferreteria", "referido", "otro"]);

export const proveedores = pgTable("proveedores", {
  id: uuid().primaryKey().defaultRandom(),
  usuarioId: text().notNull().unique().references(() => user.id),
  estado: estadoProveedorEnum().notNull().default("borrador"),
  segmento: segmentoProveedorEnum(),
  // Públicos
  nombrePublico: text().notNull(),
  slug: text().notNull().unique(),
  presentacion: text(),
  aniosExperiencia: integer(),
  whatsapp: text().notNull(),
  horario: jsonb(),
  paginaWeb: text(),
  /** Redes sociales y sitio web del proveedor (claves: instagram, facebook, tiktok, youtube, web) como enlaces https; se muestran en su página pública. */
  redesSociales: jsonb().$type<Record<string, string>>(),
  emiteFactura: boolean().default(false),
  ofreceGarantia: boolean().default(false),
  /** «Atiendo urgencias el mismo día». Lo declara el proveedor; LasTresB no presta el servicio ni promete tiempos. */
  atiendeUrgencias: boolean().notNull().default(false),
  /** «Atiendo 24 horas, incluidos fines de semana y festivos». Lo declara el proveedor. */
  disponible24h: boolean("disponible_24h").notNull().default(false),
  /** Foto de perfil opcional y pública (bucket `publico`): da confianza al cliente. */
  fotoPerfil: text("foto_perfil"),
  /** «Acuerdo el valor de la visita con el cliente (por ejemplo, si estoy cerca)». Lo declara el proveedor; no se inventa precio. */
  visitaAConvenir: boolean("visita_a_convenir").notNull().default(false),
  formasPago: text().array(),
  // Privados (RF-10: nunca en el perfil público)
  tipoDocumento: tipoDocumentoEnum(),
  documentoCifrado: text(), // AES-256-GCM, ver src/cifrado.ts
  documentoHuella: text(), // HMAC del documento: detectar duplicados sin descifrar
  direccionNotificaciones: text(),
  /** Solo el número de la matrícula o tarjeta profesional (sin foto), para los oficios que la exigen. */
  numeroMatricula: text("numero_matricula"),
  // Origen del primer ingreso (UTM). utm_term trae el ID de seguimiento de la hoja de prospección (p. ej. P-017). Privado.
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  fechaNacimiento: date(),
  rutFechaLimite: date(),
  motivoRechazo: text(),
  // Seguimiento interno del equipo (nunca en público)
  fuenteOrigen: fuenteOrigenEnum(),
  primerContacto: date(),
  ultimoContacto: date(),
  proximaAccion: text(),
  notasInternas: text(),
  /** 0–100, calculado en lib/completitud.ts: nombre, WhatsApp, oficio, zona, descripción y 3 fotos de trabajos. */
  completitud: integer().notNull().default(0),
  // Caché de reputación
  promedio: real().notNull().default(0),
  totalResenas: integer().notNull().default(0),
  aprobadoEn: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("proveedores_documento_huella_idx").on(t.documentoHuella)]);

export const proveedorCategorias = pgTable(
  "proveedor_categorias",
  {
    proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
    categoriaId: integer().notNull().references(() => categorias.id),
  },
  (t) => [primaryKey({ columns: [t.proveedorId, t.categoriaId] })],
);

export const proveedorLocalidades = pgTable(
  "proveedor_localidades",
  {
    proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
    localidadId: integer().notNull().references(() => localidades.id),
  },
  (t) => [primaryKey({ columns: [t.proveedorId, t.localidadId] })],
);

export const unidadPrecioEnum = pgEnum("unidad_precio", ["visita", "hora", "clase", "metro2", "trayecto", "trabajo"]);

/** CU-35: servicios con "precio desde" orientativo. */
export const serviciosProveedor = pgTable("servicios_proveedor", {
  id: serial().primaryKey(),
  proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
  categoriaId: integer().references(() => categorias.id),
  nombre: text().notNull(),
  descripcion: text(),
  precioDesde: numeric({ precision: 12, scale: 0 }),
  unidad: unidadPrecioEnum().notNull().default("visita"),
  orden: integer().notNull().default(0),
  visible: boolean().notNull().default(true),
});

/** CU-41: slugs anteriores con redirección 301. */
export const slugsHistorial = pgTable("slugs_historial", {
  slug: text().primaryKey(),
  proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
  cambiadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const estadoContenidoEnum = pgEnum("estado_contenido", ["visible", "oculto", "eliminado", "en_revision"]);

export const portafolioFotos = pgTable("portafolio_fotos", {
  id: uuid().primaryKey().defaultRandom(),
  proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
  ruta: text().notNull(),
  rutaMiniatura: text(),
  descripcion: text(),
  declaraAutoria: boolean().notNull(),
  orden: integer().notNull().default(0),
  estado: estadoContenidoEnum().notNull().default("visible"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tipoArchivoEnum = pgEnum("tipo_archivo", [
  "documento_frente", "documento_reverso", "selfie", "rut", "camara_comercio", "matricula", "autorizacion_ley_1918", "portafolio",
]);

/** Archivos en el bucket privado; la base solo guarda la ruta. Acceso con URL firmada de 5 min y auditoría. */
export const documentos = pgTable("documentos", {
  id: uuid().primaryKey().defaultRandom(),
  proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
  tipo: tipoArchivoEnum().notNull(),
  rutaPrivada: text().notNull(),
  mime: text().notNull(),
  bytes: integer().notNull(),
  eliminarDespuesDe: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const insignias = pgTable("insignias", {
  id: serial().primaryKey(),
  clave: text().notNull().unique(), // verificado, formalizado, apto_menores, certificado
  nombre: text().notNull(),
  vigenciaMeses: integer(),
});

export const proveedorInsignias = pgTable(
  "proveedor_insignias",
  {
    proveedorId: uuid().notNull().references(() => proveedores.id, { onDelete: "cascade" }),
    insigniaId: integer().notNull().references(() => insignias.id),
    otorgadaPor: text().references(() => user.id),
    otorgadaEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
    vence: date(),
  },
  (t) => [primaryKey({ columns: [t.proveedorId, t.insigniaId] })],
);

/** CU-54: historial de consultas al registro de inhabilidades (Ley 1918). */
export const consultasInhabilidades = pgTable("consultas_inhabilidades", {
  id: serial().primaryKey(),
  proveedorId: uuid().notNull().references(() => proveedores.id),
  verificadorId: text().notNull().references(() => user.id),
  resultadoLimpio: boolean().notNull(),
  soporteRuta: text(),
  consultadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * B1 · Actividad de proveedores y cola de avisos al fundador. Una fila por movimiento; `enviado_en` nulo = pendiente de correo.
 * `clave` evita duplicar eventos únicos (p. ej. la creación). Ver lib/actividad.ts.
 */
export const avisosProveedor = pgTable(
  "avisos_proveedor",
  {
    id: uuid().primaryKey().defaultRandom(),
    proveedorId: uuid("proveedor_id").notNull().references(() => proveedores.id, { onDelete: "cascade" }),
    tipo: text().notNull(),
    campos: text().array().notNull().default([]),
    detalle: text(),
    clave: text().unique(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    enviadoEn: timestamp("enviado_en", { withTimezone: true }),
    intentos: integer().notNull().default(0),
    proximoIntento: timestamp("proximo_intento", { withTimezone: true }).notNull().defaultNow(),
    error: text(),
    vistoEn: timestamp("visto_en", { withTimezone: true }),
  },
  (t) => [index("avisos_proveedor_pendientes_idx").on(t.enviadoEn, t.proximoIntento), index("avisos_proveedor_prov_idx").on(t.proveedorId, t.creadoEn)],
);
