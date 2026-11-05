"use client";

/**
 * Cuenta los clics en botones y enlaces de todo el sitio (Google Tag Manager / GA4). Solo se monta con el consentimiento de analítica
 * (ver Cookies.tsx). Cada clic envía el evento `clic_boton` con el texto, el destino y la página; en GTM se filtra por ese evento.
 * Para nombrar un botón a mano: `data-evento="nombre"`. No se envía nada escrito en formularios ni parámetros de la URL (pueden traer datos personales).
 */
import { useEffect } from "react";

type Gtag = (...a: unknown[]) => void;

/** Destino sin datos personales: ruta interna sin parámetros, o solo el dominio si es externo (p. ej. wa.me). */
function destino(href: string | null): string | undefined {
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return undefined;
  try {
    const u = new URL(href, window.location.href);
    return u.origin === window.location.origin ? u.pathname : u.hostname;
  } catch {
    return undefined;
  }
}

export function ClicsAnalitica() {
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("button, a[href], [role='button']");
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      const texto = (el.dataset.evento || el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const datos = {
        boton_texto: texto || "(sin texto)",
        boton_tipo: el.tagName === "A" ? "enlace" : "boton",
        boton_destino: destino(el.getAttribute("href")),
        pagina: window.location.pathname,
      };
      const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
      (w.dataLayer ??= []).push({ event: "clic_boton", ...datos }); // Tag Manager
      w.gtag?.("event", "clic_boton", datos); // GA4 directo (si no hay Tag Manager)
    };
    document.addEventListener("click", alClic, { capture: true });
    return () => document.removeEventListener("click", alClic, { capture: true });
  }, []);
  return null;
}
