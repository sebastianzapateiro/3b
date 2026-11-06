/** Largo máximo de la presentación («Sobre mí») del proveedor. */
export const PRESENTACION_MAX = 1000;

/** Largo máximo de lo que escribe el comprador en «¿Qué estás buscando?». */
export const MENSAJE_CONTACTO_MAX = 500;

/**
 * CU-05: enlace wa.me con mensaje prellenado (categoría y localidad), para quien contacta sin haber llenado la solicitud.
 * El clic se registra en `contactos` antes de redirigir (ver apps/web/app/api/v1/contactos).
 */
export function enlaceWhatsApp(telefonoE164: string, categoria: string, localidad: string): string {
  const mensaje = `Hola, te encontré en LasTresB. Necesito ${categoria.toLowerCase()} en ${localidad}. ¿Tienes disponibilidad?`;
  return enlaceConMensaje(telefonoE164, mensaje);
}

/** Indicativo de Colombia: los números de LasTresB son de Bogotá; el sistema lo agrega y la persona escribe solo sus 10 dígitos. */
export const INDICATIVO_CO = "+57";

/**
 * Formato estándar con el que se guarda todo WhatsApp o celular: «+57» y los 10 dígitos («+573001234567»).
 * Acepta lo que escriba la persona («300 123 4567», «573001234567», «+57 300 123 4567»); null si no parece un número.
 * (wa.me recibe solo los dígitos: `enlaceConMensaje` quita el «+».)
 */
export function normalizarWhatsapp(v: string): string | null {
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return `${INDICATIVO_CO}${d}`;
  if (d.length === 12 && d.startsWith("57")) return `+${d}`;
  return /^\d{11,13}$/.test(d) ? `+${d}` : null;
}

/** Lo que se muestra en el campo, sin el indicativo (que va fijo al lado): «+573001234567» → «300 123 4567». */
export function whatsappSinIndicativo(v: string): string {
  const d = v.replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("57") ? d.slice(2) : d;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : local;
}

export function enlaceConMensaje(telefonoE164: string, mensaje: string): string {
  return `https://wa.me/${telefonoE164.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Mensaje al proveedor cuando el comprador llenó «¿Qué estás buscando?». Lo que escribió va tal cual, entre comillas.
 * Se guarda igual en `contactos.mensaje`.
 */
export function mensajeSolicitud(d: { proveedor: string; cliente: string; categoria: string | null; lugar: string | null; solicitud: string | null }): string {
  const servicio = d.categoria ? `un servicio de ${d.categoria.toLowerCase()}` : "un servicio";
  return `Hola ${d.proveedor}, soy ${d.cliente}. Te escribo para cotizar ${servicio}${d.lugar ? ` para ${d.lugar}` : ""}.${d.solicitud ? ` Necesito: ${d.solicitud.trim()}${/[.!?]$/.test(d.solicitud.trim()) ? "" : "."}` : ""} Te encontré en la página lastresb.com.co y pude ver tu perfil.`;
}
