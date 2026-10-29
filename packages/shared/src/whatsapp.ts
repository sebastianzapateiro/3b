/**
 * CU-05: enlace wa.me con mensaje prellenado (categoría y localidad).
 * El clic se registra en `contactos` antes de redirigir (ver apps/web/app/api/v1/contactos).
 */
export function enlaceWhatsApp(telefonoE164: string, categoria: string, localidad: string): string {
  const numero = telefonoE164.replace(/\D/g, "");
  const mensaje = `Hola, te encontré en LasTresB. Necesito ${categoria.toLowerCase()} en ${localidad}. ¿Tienes disponibilidad?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
