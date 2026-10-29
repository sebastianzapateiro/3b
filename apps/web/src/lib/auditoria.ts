/**
 * B8 · Registro en `auditoria` (regla 3: solo inserciones, nunca UPDATE ni DELETE).
 * Cada acción del backoffice llama a `auditar`.
 */
import { headers } from "next/headers";
import { db, schema } from "@las3b/db";
import { ipDeLaPeticion } from "@/lib/consentimientos";

export async function auditar(a: {
  actorId: string;
  rol: string | null;
  accion: string;
  objetoTipo?: string;
  objetoId?: string;
  resultado?: string;
  motivo?: string;
  metadatos?: Record<string, unknown>;
}) {
  const h = await headers();
  await db.insert(schema.auditoria).values({
    ...a,
    resultado: a.resultado ?? "ok",
    ip: ipDeLaPeticion(h),
    dispositivo: h.get("user-agent"),
  });
}
