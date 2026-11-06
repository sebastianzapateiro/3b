"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { ClicsAnalitica } from "@/components/ClicsAnalitica";

/**
 * Consentimiento de cookies (Ley 1581 de 2012). Las cookies necesarias (sesión, contacto) no requieren permiso;
 * las de analítica (Google Analytics 4) solo se cargan si la persona las acepta. La elección se guarda en el navegador.
 */
const CLAVE = "cookies_analitica_v1";
type Eleccion = "si" | "no" | null;

function leer(): Eleccion {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "si" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

function guardar(v: "si" | "no") {
  try {
    localStorage.setItem(CLAVE, v);
  } catch {}
  window.dispatchEvent(new Event("cookies:cambio"));
}

function useEleccion() {
  const [eleccion, setEleccion] = useState<Eleccion | undefined>(undefined);
  useEffect(() => {
    const alCambiar = () => setEleccion(leer());
    alCambiar();
    window.addEventListener("cookies:cambio", alCambiar);
    return () => window.removeEventListener("cookies:cambio", alCambiar);
  }, []);
  return eleccion;
}

/** Estado del modo de consentimiento de Google: la analítica solo usa cookies con permiso; publicidad, nunca. */
const consentimiento = (analitica: boolean) =>
  JSON.stringify({ analytics_storage: analitica ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });

/**
 * Google Analytics en producción con el modo de consentimiento de Google (Consent Mode v2).
 * Sin permiso se carga sin cookies: Google recibe avisos anónimos y estima las visitas; al aceptar se activan las cookies `_ga`.
 */
export function AnaliticaConsentida({ id, activa, gtm }: { id: string; activa: boolean; gtm?: string }) {
  const eleccion = useEleccion();

  // Si la persona cambia de opinión, se avisa a Google sin recargar la página.
  useEffect(() => {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (eleccion !== undefined) gtag?.("consent", "update", JSON.parse(consentimiento(eleccion === "si")));
  }, [eleccion]);

  // Espera a leer la elección guardada para arrancar con el estado correcto.
  if (!activa || eleccion === undefined) return null;
  const base = `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('consent','default',${consentimiento(eleccion === "si")});gtag('set','ads_data_redaction',true);`;
  return (
    <>
      {gtm ? (
        // Con Google Tag Manager, el contenedor es quien carga GA4 y las etiquetas: no se carga GA4 aparte (evita contar dos veces).
        <Script id="gtm" strategy="afterInteractive">
          {`${base}window.conTagManager=true;dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=${gtm}';document.head.appendChild(s);`}
        </Script>
      ) : (
        <>
          <Script id="ga4" strategy="afterInteractive">
            {`${base}gtag('js',new Date());gtag('config','${id}');`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
        </>
      )}
      <ClicsAnalitica />
    </>
  );
}

export function BannerCookies({ activa }: { activa: boolean }) {
  const eleccion = useEleccion();
  const [reabierto, setReabierto] = useState(false);

  useEffect(() => {
    const abrir = () => setReabierto(true);
    window.addEventListener("cookies:abrir", abrir);
    return () => window.removeEventListener("cookies:abrir", abrir);
  }, []);

  // Sin analítica activa (local, preview) no hay nada que pedir.
  if (!activa || eleccion === undefined || (eleccion !== null && !reabierto)) return null;

  const elegir = (v: "si" | "no") => {
    guardar(v);
    setReabierto(false);
  };

  return (
    <div role="dialog" aria-labelledby="cookies-titulo" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[720px] flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-4 shadow-[0_12px_40px_rgba(27,38,35,0.18)] sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex flex-1 flex-col gap-1">
        <b id="cookies-titulo" className="text-base">Cookies para mejorar LasTresB</b>
        <p className="text-sm leading-normal text-tinta-2">
          Usamos cookies necesarias para que el sitio funcione y, si nos dejas, cookies de analítica para saber qué páginas sirven. Puedes cambiar tu decisión cuando quieras. <Link href="/cookies" className="font-semibold text-verde underline">Más información</Link>
        </p>
      </div>
      <div className="flex gap-2 sm:flex-none">
        <button type="button" onClick={() => elegir("no")} className="h-11 flex-1 rounded-xl border-2 border-tinta px-4 text-sm font-semibold text-tinta sm:flex-none">Solo necesarias</button>
        <button type="button" onClick={() => elegir("si")} className="h-11 flex-1 rounded-xl bg-tinta px-4 text-sm font-semibold text-white sm:flex-none">Aceptar analítica</button>
      </div>
    </div>
  );
}

/** Enlace del pie para reabrir la decisión. */
export function BotonCookies({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("cookies:abrir"))} className={className}>
      Configurar cookies
    </button>
  );
}
