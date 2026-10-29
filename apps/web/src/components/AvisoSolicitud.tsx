"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Contenido() {
  const p = useSearchParams();
  if (p.get("solicitud")) {
    return <p role="status" className="rounded-xl bg-verde-claro p-4 text-[15px] text-verde-oscuro"><b>¡Listo!</b> Guardamos tu solicitud. Si dejaste tu WhatsApp, te avisaremos cuando haya proveedores.</p>;
  }
  const error = p.get("error");
  return error ? <p role="alert" className="rounded-xl bg-ladrillo-suave p-3 text-[15px] text-ladrillo-oscuro">{error}</p> : null;
}

/** Resultado del envío del formulario de demanda. Se lee en el navegador para que la página siga siendo estática (ISR). */
export function AvisoSolicitud() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}