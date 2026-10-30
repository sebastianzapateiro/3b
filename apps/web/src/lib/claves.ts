/**
 * B4 · Clave asignada por el equipo (CU-72). Un admin le pone una clave nueva a una cuenta cuando la persona
 * no puede recuperarla sola (sin acceso al correo, alta asistida sin correo real).
 * Igual que `setUserPassword` del plugin admin de Better Auth: actualiza la cuenta «credential» o la crea
 * si la persona solo entraba con Google o aún no aceptaba la invitación.
 */
import { and, eq, like } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { enviarCorreo } from "@/lib/correo";
import { esCorreoFicticio } from "@/lib/invitaciones";

const { user, session, verification } = schema;

export const CLAVE_MIN = 8;
export const CLAVE_MAX = 128;

/**
 * Guarda la clave, anula invitaciones pendientes y cierra todas las sesiones de la persona.
 * Marca el correo como verificado: el admin responde por la cuenta y sin eso Better Auth no deja ingresar con clave.
 */
export async function asignarClave(usuarioId: string, clave: string) {
  const ctx = await auth.$context;
  const persona = await ctx.internalAdapter.findUserById(usuarioId);
  if (!persona) return null;

  const hash = await ctx.password.hash(clave);
  if (await ctx.internalAdapter.findCredentialAccount(usuarioId)) await ctx.internalAdapter.updatePassword(usuarioId, hash);
  else await ctx.internalAdapter.createAccount({ userId: usuarioId, providerId: "credential", accountId: usuarioId, password: hash });

  if (!persona.emailVerified) await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, usuarioId));
  await db.delete(verification).where(and(eq(verification.value, usuarioId), like(verification.identifier, "reset-password:%")));
  await db.delete(session).where(eq(session.userId, usuarioId));

  if (!esCorreoFicticio(persona.email)) {
    void enviarCorreo({
      para: persona.email,
      asunto: "Cambiaron tu clave de LasTresB",
      texto: `Hola, ${persona.name}. El equipo de LasTresB te asignó una clave nueva y cerró tus sesiones abiertas.\nSi no lo pediste, escríbenos de inmediato.`,
    });
  }
  return { correo: persona.email };
}
