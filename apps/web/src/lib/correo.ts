/**
 * Envío de correos transaccionales (verificación, recuperación de clave).
 * Pendiente: conectar un proveedor (Resend, SES…). Mientras tanto el enlace sale en la consola del servidor.
 */
type Correo = { para: string; asunto: string; texto: string };

export async function enviarCorreo({ para, asunto, texto }: Correo) {
  console.info(`[correo] Para: ${para}\n[correo] Asunto: ${asunto}\n${texto}\n`);
}
