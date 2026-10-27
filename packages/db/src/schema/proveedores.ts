/** P3 / B1 / B2 · Proveedores, portafolio, documentos privados e insignias. */
import {
  boolean, date, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, real, serial, text, timestamp, uuid,
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
  emiteFactura: boolean().default(false),
  ofreceGarantia: boolean().default(false),
  formasPago: text().array(),
  // Privados (RF-10: nunca en el perfil público)
  tipoDocumento: tipoDocumentoEnum(),
  documentoCifrado: text(),
  direccionNotificaciones: text(),
  fechaNacimiento: date(),
  rutFechaLimite: date(),
  motivoRechazo: text(),
  // Caché de reputación
  promedio: real().notNull().default(0),
  totalResenas: integer().notNull().default(0),
  aprobadoEn: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

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
  "documento_frente", "documento_reverso", "rut", "camara_comercio", "matricula", "autorizacion_ley_1918", "portafolio",
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
