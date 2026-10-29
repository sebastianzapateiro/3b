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

/** Apple Sign-In: se activa solo cuando existan las credenciales (cuenta de Apple Developer). */
export const appleHabilitado = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET);

const social = {
  ...(googleHabilitado ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } } : {}),
  ...(appleHabilitado ? { apple: { clientId: process.env.APPLE_CLIENT_ID!, clientSecret: process.env.APPLE_CLIENT_SECRET! } } : {}),
};

/**
 * El sitio puede servirse con y sin «www» (según el dominio principal en Vercel). Better Auth rechaza con
 * INVALID_ORIGIN cualquier origen distinto de BETTER_AUTH_URL, así que se aceptan ambas variantes del mismo dominio.
 */
function origenesConfiables(): string[] {
  const base = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  try {
    const u = new URL(base);
    const sinWww = u.host.replace(/^www\./, "");
    return [`${u.protocol}//${sinWww}`, `${u.protocol}//www.${sinWww}`];
  } catch {
    return [];
  }
}

export const auth = betterAuth({
  appName: "LasTresB",
  trustedOrigins: origenesConfiables(),
  advanced: {
    // Vercel fija x-real-ip con la IP del cliente. Sin una IP válida, Better Auth junta a todos en un solo
    // contador del límite de intentos (5 ingresos por minuto para todo el sitio).
    ipAddress: { ipAddressHeaders: ["x-real-ip", "x-forwarded-for"] },
  },
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
    autoSignInAfterVerification: false, // tras confirmar vuelve a /ingreso?verificado=1
    sendVerificationEmail: async ({ user, url }) => {
      void enviarCorreo({
        para: user.email,
        asunto: "Confirma tu correo en LasTresB",
        texto: `Hola, ${user.name}. Confirma tu correo abriendo este enlace:\n${url}`,
      });
    },
  },
  socialProviders: social,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días (PWA); el equipo del backoffice, 8 h: ver lib/verificacion.ts
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
  // Límite por IP: más estricto en los intentos de ingreso y de creación de cuenta.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/social": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  // «Confiar en este equipo» dura lo mismo que la sesión del backoffice (8 h); por defecto Better Auth usa 30 días.
  plugins: [twoFactor({ issuer: "LasTresB", trustDeviceMaxAge: 8 * 60 * 60 }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
