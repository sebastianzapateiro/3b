/**
 * A0 · Autenticación (Better Auth). Web: cookie httpOnly. App móvil (fase 2): tokens vía /api/auth.
 * Reglas: docs/03-arquitectura.md § Autenticación.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db, schema } from "@las3b/db";
import { ipDeLaPeticion, POLITICAS_REGISTRO_COMPRADOR, registrarConsentimientos } from "./consentimientos";
import { enviarCorreo } from "./correo";

export const googleHabilitado = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const google = googleHabilitado
  ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
  : undefined;

export const auth = betterAuth({
  appName: "LasTresB",
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
    sendResetPassword: async ({ user, url }) => {
      void enviarCorreo({
        para: user.email,
        asunto: "Cambia tu clave de LasTresB",
        texto: `Hola, ${user.name}. Para crear una clave nueva abre este enlace (vence en 1 hora):\n${url}\n\nSi no lo pediste, ignora este correo.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false, // tras confirmar vuelve a /ingresar?verificado=1
    sendVerificationEmail: async ({ user, url }) => {
      void enviarCorreo({
        para: user.email,
        asunto: "Confirma tu correo en LasTresB",
        texto: `Hola, ${user.name}. Confirma tu correo abriendo este enlace:\n${url}`,
      });
    },
  },
  socialProviders: google,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días (PWA); el backoffice usa 8 h, ver proxy.ts
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      declaraMayorDeEdad: { type: "boolean", required: false, defaultValue: false, input: true },
      telefono: { type: "string", required: false, input: true },
    },
  },
  hooks: {
    // CU-07 / RF-19: el registro con correo exige mayoría de edad y aceptar las políticas (casillas no premarcadas).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      if (ctx.body?.declaraMayorDeEdad !== true || ctx.body?.aceptaPoliticas !== true) {
        throw new APIError("BAD_REQUEST", {
          code: "FALTA_CONSENTIMIENTO",
          message: "Debes declarar que eres mayor de edad y aceptar los términos y la política de datos.",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          if (ctx?.path !== "/sign-up/email") return;
          await registrarConsentimientos(user.id, POLITICAS_REGISTRO_COMPRADOR, {
            ip: ipDeLaPeticion(ctx.headers),
            userAgent: ctx.headers?.get("user-agent") ?? null,
          });
        },
      },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [twoFactor({ issuer: "LasTresB" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
