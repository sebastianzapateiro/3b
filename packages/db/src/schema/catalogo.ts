/** P2 / B5 · Catálogo: categorías de dos niveles, localidades y diccionario de búsqueda. */
import { type AnyPgColumn, boolean, integer, pgTable, real, serial, text, unique } from "drizzle-orm/pg-core";

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
