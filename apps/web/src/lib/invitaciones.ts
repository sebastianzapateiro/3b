/**
 * B1 / B4 · Invitaciones a cuentas creadas por el equipo (CU-51, CU-72).
 * La cuenta nace sin clave: el enlace lleva a /nueva-clave con un token de Better Auth (de un solo uso,
 * vigencia `invitacion_vigencia_h` en `configuracion`). Al usarlo se crea la clave y el token desaparece.
 * Para el equipo del backoffice: alta de usuarios y alta asistida de proveedores.
 */
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { enviarCorreo } from "@/lib/correo";
import { parametro } from "@/lib/parametros";

const { verification, account } = schema;
const PREFIJO = "reset-password:";

/** Correo de relleno que usa el alta asistida cuando el proveedor no tiene correo. */
export const esCorreoFicticio = (correo: string) => correo.endsWith(".invalid");

/**
 * Crea un enlace de invitación nuevo (anula los anteriores del mismo usuario) y devuelve la URL.
 * `destino` es a dónde ir después de ingresar con la clave nueva.
 */
export async function crearInvitacion(usuarioId: string, destino = "/") {
  const ctx = await auth.$context;
  const token = randomBytes(24).toString("base64url");
  const horas = await parametro("invitacion_vigencia_h");
  await db.delete(verification).where(and(eq(verification.value, usuarioId), like(verification.identifier, `${PREFIJO}%`)));
  await ctx.internalAdapter.createVerificationValue({ identifier: `${PREFIJO}${token}`, value: usuarioId, expiresAt: new Date(Date.now() + horas * 3_600_000) });
  const base = ctx.baseURL.replace(/\/api\/auth$/, "");
  const url = `${base}/nueva-clave?${new URLSearchParams({ token, ...(destino !== "/" ? { destino } : {}) })}`;
  return { url, horas };
}

export async function enviarInvitacionPorCorreo(a: { para: string; nombre: string; url: string; horas: number; motivo: string }) {
  await enviarCorreo({
    para: a.para,
    asunto: "Te crearon una cuenta en LasTresB",
    texto: `Hola, ${a.nombre}. ${a.motivo}\nPara elegir tu clave abre este enlace (vence en ${a.horas} horas):\n${a.url}\n\nSi no esperabas este correo, ignóralo.`,
  });
}

/** Enlace wa.me con el mensaje de invitación ya escrito: el equipo lo abre y lo envía desde su WhatsApp. */
export function invitacionPorWhatsApp(whatsapp: string, nombre: string, url: string, horas: number) {
  const numero = whatsapp.replace(/\D/g, "");
  const conPais = numero.length === 10 ? `57${numero}` : numero;
  const texto = `Hola, ${nombre}. Te registramos en LasTresB. Entra a este enlace para crear tu clave, revisar tus datos y aceptar los términos (vence en ${horas} horas): ${url}`;
  return `https://wa.me/${conPais}?${new URLSearchParams({ text: texto })}`;
}

export type EstadoInvitacion = "acepto" | "esperando" | "vencio" | "sin_invitacion";

/** Estado de la invitación de cada usuario: aceptó si ya tiene clave; si no, según su token más reciente. */
export async function estadoInvitaciones(usuarioIds: string[]) {
  const mapa = new Map<string, { estado: EstadoInvitacion; vence: Date | null }>();
  if (usuarioIds.length === 0) return mapa;
  const [cuentas, tokens] = await Promise.all([
    db.select({ usuarioId: account.userId }).from(account).where(and(inArray(account.userId, usuarioIds), eq(account.providerId, "credential"))),
    db.select({ usuarioId: verification.value, vence: verification.expiresAt }).from(verification).where(and(inArray(verification.value, usuarioIds), like(verification.identifier, `${PREFIJO}%`))),
  ]);
  const conClave = new Set(cuentas.map((c) => c.usuarioId));
  for (const id of usuarioIds) {
    if (conClave.has(id)) { mapa.set(id, { estado: "acepto", vence: null }); continue; }
    const t = tokens.filter((x) => x.usuarioId === id).sort((a, b) => +b.vence - +a.vence)[0];
    mapa.set(id, t ? { estado: t.vence > new Date() ? "esperando" : "vencio", vence: t.vence } : { estado: "sin_invitacion", vence: null });
  }
  return mapa;
}

/** URL de la invitación vigente (para reenviarla por WhatsApp desde el backoffice), o null si no hay. */
export async function enlaceVigente(usuarioId: string, destino = "/") {
  const [t] = await db
    .select({ identifier: verification.identifier, vence: verification.expiresAt })
    .from(verification)
    .where(and(eq(verification.value, usuarioId), like(verification.identifier, `${PREFIJO}%`)))
    .orderBy(desc(verification.expiresAt))
    .limit(1);
  if (!t || t.vence <= new Date()) return null;
  const base = (await auth.$context).baseURL.replace(/\/api\/auth$/, "");
  const token = t.identifier.slice(PREFIJO.length);
  return { url: `${base}/nueva-clave?${new URLSearchParams({ token, ...(destino !== "/" ? { destino } : {}) })}`, vence: t.vence };
}
