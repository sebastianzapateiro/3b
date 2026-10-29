"use server";

/** A0 · Acciones del ingreso único: guardar el tipo elegido, confirmar la cuenta nueva (Google/Apple) o cancelarla. */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { ipDeLaPeticion, registrarConsentimientos } from "@/lib/consentimientos";
import { destinoSeguro } from "@/lib/destino";
import { esTipoUsuario, guardarTipo, leerTipo, POLITICAS_POR_TIPO, tieneConsentimiento } from "@/lib/ingreso";

export async function elegirTipo(tipo: string) {
  if (esTipoUsuario(tipo)) await guardarTipo(tipo);
}

/** Casilla obligatoria: crea la cuenta (queda lista) y guarda el consentimiento con versión, fecha e IP. */
export async function confirmarCuenta(formData: FormData) {
  const h = await headers();
  const sesion = await auth.api.getSession({ headers: h });
  const destino = destinoSeguro(formData.get("destino")?.toString());
  if (!sesion?.user) redirect("/ingreso");
  if (formData.get("acepto") !== "on") redirect(`/ingreso/listo?destino=${encodeURIComponent(destino)}&error=acepto`);

  const tipo = await leerTipo();
  if (!(await tieneConsentimiento(sesion.user.id))) {
    await registrarConsentimientos(sesion.user.id, [...POLITICAS_POR_TIPO[tipo]], { ip: ipDeLaPeticion(h), userAgent: h.get("user-agent") });
    await db.update(schema.user).set({ declaraMayorDeEdad: true }).where(eq(schema.user.id, sesion.user.id));
  }
  // Proveedor: sigue al alta (CU-30); el perfil queda pendiente de verificación y no sale en la búsqueda.
  redirect(tipo === "proveedor" ? "/proveedores/registro" : destino);
}

/** Cancelar: no se guarda nada. Se borra la cuenta recién creada (sin consentimiento) y se cierra la sesión. */
export async function cancelarCuenta() {
  const h = await headers();
  const sesion = await auth.api.getSession({ headers: h });
  if (sesion?.user && !(await tieneConsentimiento(sesion.user.id))) {
    await db.delete(schema.user).where(eq(schema.user.id, sesion.user.id));
  }
  await auth.api.signOut({ headers: h }).catch(() => {});
  redirect("/ingreso");
}
