/**
 * A0 · Autenticación (Better Auth). Web: cookie httpOnly. App móvil (fase 2): tokens vía /api/auth.
 * Reglas: docs/03-arquitectura.md § Autenticación.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db, schema } from "@las3b/db";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  appName: "Las 3B",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: google,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días (PWA); el backoffice usa 8 h, ver middleware
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      declaraMayorDeEdad: { type: "boolean", required: false, defaultValue: false, input: true },
      telefono: { type: "string", required: false, input: true },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [twoFactor({ issuer: "Las 3B" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
