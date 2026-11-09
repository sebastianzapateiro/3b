/**
 * Eventos de analítica del navegador (Tag Manager / GA4). Código solo de navegador.
 * Van al `dataLayer` (Tag Manager decide qué reenviar a GA4: ver infra/gtm/contenedor-lastresb.json) y, sin Tag Manager, directo a GA4.
 * Sin consentimiento de analítica Google no guarda cookies ni identifica a nadie (modo de consentimiento, Cookies.tsx).
 * Nunca se envían datos personales: ni nombre, ni WhatsApp, ni correo.
 *
 * EVENTOS CLAVE (conversiones) en GA4:
 *  - `contacto_proveedor`: una persona pasa a hablar con un proveedor por WhatsApp (el valor del negocio). Parámetro: `origen`.
 *  - `registro_proveedor`: un proveedor crea su cuenta (la oferta que da contenido al sitio). Parámetro: `metodo`.
 */

export type EventoClave = "contacto_proveedor" | "registro_proveedor";

type Parametros = Record<string, string | number | undefined>;

export function enviarEvento(nombre: string, parametros: Parametros = {}) {
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; conTagManager?: boolean };
  const limpios = Object.fromEntries(Object.entries(parametros).filter(([, v]) => v !== undefined));
  (w.dataLayer ??= []).push({ event: nombre, ...limpios }); // Tag Manager
  if (!w.conTagManager) w.gtag?.("event", nombre, limpios); // GA4 directo (con Tag Manager llegaría dos veces)
}

/* ───── Contacto con un proveedor ───── */

const CLAVE_DATOS = "l3b_datos_contacto";
/** La cookie de la solicitud dura 30 días (COOKIE_SOLICITUD): mientras vale, el formulario no vuelve a pedirse. */
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;

/** Recuerda que esta persona ya dejó sus datos: sus próximos contactos van directo a WhatsApp, sin formulario. */
export function recordarDatosDeContacto() {
  try {
    localStorage.setItem(CLAVE_DATOS, String(Date.now()));
  } catch {}
}

export function yaDejoDatosDeContacto(): boolean {
  try {
    const t = Number(localStorage.getItem(CLAVE_DATOS));
    return Number.isFinite(t) && t > 0 && Date.now() - t < VIGENCIA_MS;
  } catch {
    return false;
  }
}

/** Origen del contacto (`perfil`, `busqueda`, `qr`, `redes`, `banner`) a partir de un enlace de `/api/v1/contactos/ir`. */
export function origenDeContacto(href: string): string | undefined {
  try {
    const u = new URL(href, window.location.origin);
    return u.searchParams.get("origen") ?? u.searchParams.get("volver")?.match(/origen=([a-z]+)/)?.[1] ?? undefined;
  } catch {
    return undefined;
  }
}

export const esEnlaceDeContacto = (href: string | null): boolean => {
  if (!href) return false;
  try {
    return new URL(href, window.location.origin).pathname === "/api/v1/contactos/ir";
  } catch {
    return false;
  }
};
