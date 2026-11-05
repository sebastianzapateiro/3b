/**
 * A0 · Ayuda para inscribirse como proveedor (CU-30): textos, horario y enlace de WhatsApp.
 * Es código puro (sin base de datos): lo usan el botón flotante, la tarjeta de /ingreso y el servidor.
 * El número es el WhatsApp de LasTresB que ya usa el proyecto: NEXT_PUBLIC_WHATSAPP_AYUDA (10 dígitos o con indicativo 57).
 */

/** Horario de atención. Si cambia, se edita aquí y se actualizan todos los textos. */
export const HORARIO_AYUDA = "todos los días, a toda hora";

export const TEXTO_ATENCION = `Te atendemos ${HORARIO_AYUDA}. Una persona del equipo te acompaña paso a paso.`;

export const MENSAJE_WHATSAPP_AYUDA = "Hola, quiero inscribirme como proveedor en LasTresB y necesito ayuda. Mi oficio es: ";

export const ORIGENES_AYUDA = ["boton_flotante", "ingreso", "menu"] as const;
export type OrigenAyuda = (typeof ORIGENES_AYUDA)[number];

/** Evento del navegador que abre el panel de ayuda (lo escuchan el botón flotante, y lo disparan /ingreso y el menú). */
export const EVENTO_ABRIR_AYUDA = "ayuda:abrir";

const bruto = (process.env.NEXT_PUBLIC_WHATSAPP_AYUDA ?? "").replace(/\D/g, "");
export const NUMERO_AYUDA = bruto.length === 10 ? `57${bruto}` : bruto;
export const HAY_WHATSAPP_AYUDA = NUMERO_AYUDA.length >= 11;

/** Enlace wa.me al WhatsApp del equipo con el mensaje ya escrito; null si no hay número configurado. */
export function enlaceAyuda(mensaje: string = MENSAJE_WHATSAPP_AYUDA): string | null {
  return HAY_WHATSAPP_AYUDA ? `https://wa.me/${NUMERO_AYUDA}?${new URLSearchParams({ text: mensaje })}` : null;
}

/** Evento de analítica (GA4, solo si la persona aceptó las cookies de analítica; sin consentimiento no hace nada). */
export function eventoAyuda(nombre: "ayuda_abrir_panel" | "ayuda_clic_whatsapp" | "ayuda_enviar_llamada" | "ayuda_inscribirme_solo", origen: OrigenAyuda) {
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  gtag?.("event", nombre, { origen });
}
