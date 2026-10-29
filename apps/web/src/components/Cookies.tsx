"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

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

/** Carga Google Analytics solo con consentimiento y solo en producción. */
export function AnaliticaConsentida({ id, activa }: { id: string; activa: boolean }) {
  const eleccion = useEleccion();
  if (!activa || eleccion !== "si") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
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
        <b id="cookies-titulo" className="text-base">Cookies para mejorar Las 3B</b>
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
