/**
 * Envío de correos transaccionales (verificación, recuperación de clave).
 * Si existe RESEND_API_KEY, usa la API de Resend (https://resend.com).
 * Mientras tanto, el enlace sale en la consola del servidor (desarrollo/local).
 * Cada intento queda en `correos_enviados` (para quién, asunto y resultado; nunca el cuerpo) y se ve en /admin/correos.
 */
import { db, schema } from "@las3b/db";

type Correo = { para: string; /** Remitente; por defecto LasTresB <noreply@lastresb.com.co>. */ de?: string; asunto: string; texto: string; /** Versión con diseño; el texto plano va siempre como respaldo. */ html?: string };

/** Anota el intento. Nunca lanza ni espera: un fallo aquí no puede frenar el correo ni el flujo que lo pidió. */
function anotar(para: string, asunto: string, estado: "enviado" | "error" | "simulado", error?: string) {
  void db
    .insert(schema.correosEnviados)
    .values({ para, asunto: asunto.slice(0, 300), estado, error: error?.slice(0, 500) ?? null })
    .catch((e) => console.error("[correo] No se pudo anotar el envío:", e));
}

/** Devuelve true si el proveedor de correo lo aceptó; false si falló o si solo se mostró en consola. */
export async function enviarCorreo({ para, de, asunto, texto, html }: Correo): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: de ?? "LasTresB <noreply@lastresb.com.co>",
          to: [para],
          subject: asunto,
          text: texto,
          ...(html ? { html } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[correo] Resend error:", err);
        console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
        anotar(para, asunto, "error", `Resend ${res.status}: ${err}`);
        return false;
      }
      console.info(`[correo] Enviado via Resend a ${para}: ${asunto}`);
      anotar(para, asunto, "enviado");
      return true;
    } catch (e) {
      console.error("[correo] Error Resend:", e);
      anotar(para, asunto, "error", e instanceof Error ? e.message : String(e));
    }
  } else {
    anotar(para, asunto, "simulado");
  }
  console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
  return false;
}
