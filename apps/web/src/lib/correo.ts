/**
 * Envío de correos transaccionales (verificación, recuperación de clave).
 * Si existe RESEND_API_KEY, usa la API de Resend (https://resend.com).
 * Mientras tanto, el enlace sale en la consola del servidor (desarrollo/local).
 */
type Correo = { para: string; asunto: string; texto: string };

export async function enviarCorreo({ para, asunto, texto }: Correo) {
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
          from: "Las 3B <noreply@lastresb.com.co>",
          to: [para],
          subject: asunto,
          text: texto,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[correo] Resend error:", err);
        console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
        return;
      }
      console.info(`[correo] Enviado via Resend a ${para}: ${asunto}`);
      return;
    } catch (e) {
      console.error("[correo] Error Resend:", e);
    }
  }
  console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
}
