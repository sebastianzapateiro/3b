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

/** 10 dígitos de celular colombiano → con indicativo 57, listo para wa.me; null si no parece un número. */
export function normalizarWhatsapp(v: string): string | null {
  const digitos = v.replace(/\D/g, "");
  const n = digitos.length === 10 ? `57${digitos}` : digitos;
  return /^\d{11,13}$/.test(n) ? n : null;
}

export function enlaceConMensaje(telefonoE164: string, mensaje: string): string {
  return `https://wa.me/${telefonoE164.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Mensaje al proveedor cuando el comprador llenó «¿Qué estás buscando?». Lo que escribió va tal cual, entre comillas.
 * Se guarda igual en `contactos.mensaje`.
 */
export function mensajeSolicitud(d: { proveedor: string; cliente: string; categoria: string | null; lugar: string | null; solicitud: string }): string {
  const servicio = d.categoria ? `un servicio de ${d.categoria.toLowerCase()}` : "un servicio";
  return `Hola ${d.proveedor}, soy ${d.cliente}. Te escribo para cotizar ${servicio}${d.lugar ? ` para ${d.lugar}` : ""}. Te encontré en la página lastresb.com.co y pude ver tu perfil. Solicitud: "${d.solicitud}"`;
}
