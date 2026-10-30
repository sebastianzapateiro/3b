/**
 * P5 / P8 · Piezas puras de la calificación posterior al servicio (CU-38, CU-20): código del servicio, enlace y mensaje.
 * Sin base de datos, para poder probarlas.
 */

/** Sin 0/O ni 1/I/L para que el código se lea bien por WhatsApp. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigo(largo = 6, aleatorio: () => number = Math.random): string {
  return Array.from({ length: largo }, () => ALFABETO[Math.floor(aleatorio() * ALFABETO.length)]).join("");
}

export const CODIGO_VALIDO = /^[A-HJKMNP-Z2-9]{6}$/;

/** Enlace que recibe el comprador: lleva al formulario de calificación con el código del servicio. */
export function enlaceCalificar(sitio: string, slug: string, codigo: string): string {
  return `${sitio.replace(/\/$/, "")}/${slug}/calificar?codigo=${codigo}`;
}

/** Mensaje al comprador cuando el proveedor marca «Servicio prestado». */
export function mensajeCalificacion(d: { cliente: string | null; proveedor: string; enlace: string }): string {
  return `Hola${d.cliente ? ` ${d.cliente}` : ""}, te escribimos de LasTresB. ${d.proveedor} marcó como prestado tu servicio. ¿Nos cuentas cómo te fue? Califícalo en un minuto aquí: ${d.enlace}`;
}
