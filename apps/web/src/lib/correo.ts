/**
 * Envío de correos transaccionales (verificación, recuperación de clave).
 * Si existe RESEND_API_KEY, usa la API de Resend (https://resend.com).
 * Mientras tanto, el enlace sale en la consola del servidor (desarrollo/local).
 */
type Correo = { para: string; /** Remitente; por defecto LasTresB <noreply@lastresb.com.co>. */ de?: string; asunto: string; texto: string; /** Versión con diseño; el texto plano va siempre como respaldo. */ html?: string };

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
        return false;
      }
      console.info(`[correo] Enviado via Resend a ${para}: ${asunto}`);
      return true;
    } catch (e) {
      console.error("[correo] Error Resend:", e);
    }
  }
  console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
  return false;
}
