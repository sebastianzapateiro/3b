/** P4 / P5 / B3 · Contacto por WhatsApp, servicios verificados, reseñas y reportes. */
import { boolean, integer, pgEnum, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { categorias, localidades, solicitudesServicio } from "./catalogo";
import { estadoContenidoEnum, proveedores } from "./proveedores";

/** CU-05: cada clic a WhatsApp. comprador_id nulo = visitante anónimo. */
export const contactos = pgTable("contactos", {
  id: uuid().primaryKey().defaultRandom(),
  proveedorId: uuid().notNull().references(() => proveedores.id),
  compradorId: text().references(() => user.id),
  anonimoId: text(),
  categoriaId: integer().references(() => categorias.id),
  localidadId: integer().references(() => localidades.id),
  origen: text(), // busqueda, portafolio, qr, redes
  /** Solicitud del banner «¿Qué estás buscando?» que originó el contacto, y el mensaje exacto enviado al proveedor. */
  solicitudId: uuid().references(() => solicitudesServicio.id),
  mensaje: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** CU-38: el proveedor confirma llegada y se genera un código para el comprador. */
export const servicios = pgTable("servicios", {
  id: uuid().primaryKey().defaultRandom(),
  contactoId: uuid().notNull().unique().references(() => contactos.id),
  codigo: text().notNull().unique(),
  /** Cuándo el proveedor marcó «Servicio prestado». */
  fechaLlegada: timestamp({ withTimezone: true }).notNull().defaultNow(),
  /** Cuándo se le pidió al comprador que califique y por qué canal (correo o whatsapp). Nulo = por enviar. */
  calificacionEnviadaEn: timestamp({ withTimezone: true }),
  calificacionCanal: text(),
});

/** CU-20: una reseña por contacto, cuatro criterios de 1 a 5. */
export const resenas = pgTable("resenas", {
  id: uuid().primaryKey().defaultRandom(),
  contactoId: uuid().notNull().unique().references(() => contactos.id),
  proveedorId: uuid().notNull().references(() => proveedores.id),
  compradorId: text().notNull().references(() => user.id),
  puntualidad: smallint().notNull(),
  calidad: smallint().notNull(),
  calidadPrecio: smallint().notNull(),
  cumplimiento: smallint().notNull(),
  comentario: text(),
  verificada: boolean().notNull().default(false),
  estado: estadoContenidoEnum().notNull().default("visible"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** CU-45: una sola respuesta por reseña, no editable por el proveedor. */
export const respuestasResena = pgTable("respuestas_resena", {
  resenaId: uuid().primaryKey().references(() => resenas.id, { onDelete: "cascade" }),
  texto: text().notNull(),
  estado: estadoContenidoEnum().notNull().default("visible"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tipoObjetoReporteEnum = pgEnum("tipo_objeto_reporte", ["resena", "respuesta", "foto", "servicio", "slug", "perfil"]);

/** CU-23 / CU-60 / CU-61: tabla genérica de reportes. */
export const reportes = pgTable("reportes", {
  id: uuid().primaryKey().defaultRandom(),
  tipoObjeto: tipoObjetoReporteEnum().notNull(),
  objetoId: text().notNull(),
  reportanteId: text().references(() => user.id),
  motivo: text().notNull(),
  detalle: text(),
  resuelto: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const accionesModeracion = pgTable("acciones_moderacion", {
  id: uuid().primaryKey().defaultRandom(),
  tipoObjeto: tipoObjetoReporteEnum().notNull(),
  objetoId: text().notNull(),
  moderadorId: text().notNull().references(() => user.id),
  accion: text().notNull(), // mantener, ocultar, restaurar, eliminar
  motivo: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
