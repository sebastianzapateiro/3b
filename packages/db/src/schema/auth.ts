/**
 * A0 · Autenticación y sesiones. Tablas que exige Better Auth (user, session, account,
 * verification, two_factor) más los roles de la plataforma (usuario_roles).
 * Si agregas un plugin de Better Auth, corre `npx @better-auth/cli generate` y compara.
 */
import { boolean, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  twoFactorEnabled: boolean().default(false),
  telefono: text(),
  /** CU-07: declaración de mayoría de edad del comprador. */
  declaraMayorDeEdad: boolean().notNull().default(false),
  /** CU-27: conservación bloqueada 5 años tras eliminar la cuenta. */
  eliminadoEn: timestamp({ withTimezone: true }),
  conservarHasta: timestamp({ withTimezone: true }),
  suspendidoHasta: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** 2FA (TOTP) obligatorio para roles de backoffice. */
export const twoFactor = pgTable("two_factor", {
  id: text().primaryKey(),
  secret: text().notNull(),
  backupCodes: text().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
});

/** Un usuario tiene un conjunto de roles, no un tipo de cuenta único. */
export const rolEnum = pgEnum("rol", ["comprador", "proveedor", "verificador", "moderador", "admin"]);

export const usuarioRoles = pgTable(
  "usuario_roles",
  {
    usuarioId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
    rol: rolEnum().notNull(),
    asignadoPor: text().references(() => user.id),
    asignadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.usuarioId, t.rol] })],
);
