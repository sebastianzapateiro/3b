/**
 * A0 · Ingreso único (/ingreso): tipo de usuario elegido (cliente o proveedor), decisión posterior al ingreso y consentimientos.
 * El tipo viaja en una cookie httpOnly escrita por el servidor, nunca en un parámetro de la URL, y sobrevive al ir y volver de Google.
 */
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";

export const TIPOS_USUARIO = ["cliente", "proveedor"] as const;
export type TipoUsuario = (typeof TIPOS_USUARIO)[number];

const COOKIE_TIPO = "l3b_tipo";

export const esTipoUsuario = (v: unknown): v is TipoUsuario => (TIPOS_USUARIO as readonly string[]).includes(String(v));

export async function guardarTipo(tipo: TipoUsuario) {
  (await cookies()).set(COOKIE_TIPO, tipo, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 });
}

export async function leerTipo(): Promise<TipoUsuario> {
  const v = (await cookies()).get(COOKIE_TIPO)?.value;
  return esTipoUsuario(v) ? v : "cliente";
}

/** Políticas que se aceptan al crear la cuenta según el tipo (las del alta del proveedor se piden en el alta, CU-30). */
export const POLITICAS_POR_TIPO = {
  cliente: ["terminos_compradores", "tratamiento_datos"],
  proveedor: ["terminos_proveedores", "tratamiento_datos"],
} as const;

export async function tieneConsentimiento(usuarioId: string): Promise<boolean> {
  const [c] = await db.select({ id: schema.consentimientos.id }).from(schema.consentimientos).where(eq(schema.consentimientos.usuarioId, usuarioId)).limit(1);
  return Boolean(c);
}

export async function tieneProveedor(usuarioId: string): Promise<boolean> {
  const [p] = await db.select({ id: schema.proveedores.id }).from(schema.proveedores).where(eq(schema.proveedores.usuarioId, usuarioId)).limit(1);
  return Boolean(p);
}
