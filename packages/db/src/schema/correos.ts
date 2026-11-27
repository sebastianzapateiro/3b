/** B1 · Historial de correos enviados por el sistema (para el equipo, en /admin/correos). Sin cuerpo: puede traer enlaces con clave. */
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const correosEnviados = pgTable(
  "correos_enviados",
  {
    id: uuid().primaryKey().defaultRandom(),
    para: text().notNull(),
    asunto: text().notNull(),
    /** `enviado` (Resend lo aceptó), `error` (Resend lo rechazó o no respondió) o `simulado` (sin clave de Resend: solo salió en consola). */
    estado: text().notNull(),
    error: text(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("correos_enviados_creado_idx").on(t.creadoEn)],
);
