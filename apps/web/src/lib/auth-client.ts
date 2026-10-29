"use client";
/** Cliente de Better Auth para componentes de la web. */
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), twoFactorClient()],
});

const MENSAJES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "El correo o la clave no coinciden.",
  EMAIL_NOT_VERIFIED: "Aún no confirmas tu correo. Te enviamos de nuevo el enlace.",
  USER_ALREADY_EXISTS: "Ya hay una cuenta con ese correo. Ingresa o recupera tu clave.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya hay una cuenta con ese correo. Ingresa o recupera tu clave.",
  PASSWORD_TOO_SHORT: "La clave debe tener al menos 8 caracteres.",
  INVALID_EMAIL: "Revisa el correo, parece que tiene un error.",
  INVALID_TOKEN: "El enlace venció o ya se usó. Pide uno nuevo.",
  FALTA_CONSENTIMIENTO: "Debes declarar que eres mayor de edad y aceptar los términos y la política de datos.",
};

export function mensajeDeError(error: { code?: string; message?: string; status?: number } | null): string {
  if (!error) return "";
  if (error.status === 429) return "Demasiados intentos. Espera un minuto y vuelve a intentar.";
  return (error.code && MENSAJES[error.code]) || "Algo salió mal. Intenta de nuevo en un momento.";
}
