/** P2 / B5 · Catálogo: categorías de dos niveles, localidades y diccionario de búsqueda. */
import { type AnyPgColumn, boolean, integer, pgEnum, pgTable, real, serial, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const categorias = pgTable("categorias", {
  id: serial().primaryKey(),
  padreId: integer().references((): AnyPgColumn => categorias.id),
  nombre: text().notNull(),
  slug: text().notNull().unique(),
  icono: text(),
  orden: integer().notNull().default(0),
  exigeInsigniaMenores: boolean().notNull().default(false),
  exigeRutDesdeAlta: boolean().notNull().default(false),
  exigeMatricula: boolean().notNull().default(false),
  /** Oficio de los más buscados: va en «Lo más buscado» de /categorias. */
  popular: boolean().notNull().default(false),
  /** Sus proveedores suelen atender urgencias: habilita /servicios/[oficio]/urgente. */
  atiendeUrgencias: boolean().notNull().default(false),
  /** Subgrupo dentro de la categoría (solo Hogar). */
  subgrupo: text(),
  activa: boolean().notNull().default(true),
});

export const localidades = pgTable("localidades", {
  id: serial().primaryKey(),
  numero: integer(),
  nombre: text().notNull(),
  slug: text().notNull().unique(),
  /** false para municipios vecinos (Chía, Soacha…) que entran como S. */
  esBogota: boolean().notNull().default(true),
  activa: boolean().notNull().default(true),
});

/** CU-01: palabras clave y sinónimos por categoría (sección 5.7 de casos de uso). */
export const terminosBusqueda = pgTable(
  "terminos_busqueda",
  {
    id: serial().primaryKey(),
    termino: text().notNull(),
    categoriaId: integer().notNull().references(() => categorias.id, { onDelete: "cascade" }),
    peso: real().notNull().default(1),
  },
  (t) => [unique().on(t.termino, t.categoriaId)],
);

/** Barrio → localidad (Cedritos → Usaquén). */
export const barrios = pgTable("barrios", {
  id: serial().primaryKey(),
  nombre: text().notNull(),
  localidadId: integer().notNull().references(() => localidades.id),
});

export const estadoSolicitudServicioEnum = pgEnum("estado_solicitud_servicio", ["nueva", "avisada"]);

/**
 * Demanda sin cubrir: alguien pidió un servicio sin proveedores suficientes y dejó su WhatsApp (opcional)
 * para que le avisemos. Se muestra en el backoffice (B7). El WhatsApp es dato personal: solo se guarda con autorización.
 */
export const solicitudesServicio = pgTable("solicitudes_servicio", {
  id: uuid().primaryKey().defaultRandom(),
  /** Oficio elegido (slug) o null si escribió texto libre. */
  oficioSlug: text(),
  textoLibre: text(),
  localidadId: integer().references(() => localidades.id),
  whatsapp: text(),
  autorizaDatos: boolean().notNull().default(false),
  estado: estadoSolicitudServicioEnum().notNull().default("nueva"),
  /** false si el texto menciona un servicio que LasTresB no ofrece: se guarda pero no cuenta como demanda a cubrir. */
  cuentaComoDemanda: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});