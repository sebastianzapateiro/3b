"use client";

import Link from "next/link";
import { useId, useState } from "react";

const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta";
const etiqueta = "text-[13px] font-semibold text-gris";

/** Nombre, WhatsApp y autorización de tratamiento de datos, pedidos justo antes de conectar con un proveedor. */
export function FormularioContacto({ destino }: { destino: string }) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/v1/solicitudes/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.get("nombre"), whatsapp: f.get("whatsapp"), autoriza: f.get("autoriza") === "on", web: f.get("web") }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.error ?? "No pudimos guardar tus datos. Intenta de nuevo.");
      window.location.assign(destino);
    } catch {
      setError("No pudimos guardar tus datos. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3.5 rounded-[22px] bg-white p-5 shadow-[0_16px_48px_rgba(27,38,35,0.12)]" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-nombre`} className={etiqueta}>Tu nombre</label>
        <input id={`${id}-nombre`} name="nombre" required maxLength={80} autoComplete="given-name" className={campo} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-wa`} className={etiqueta}>Tu WhatsApp</label>
        <input id={`${id}-wa`} name="whatsapp" type="tel" required inputMode="tel" autoComplete="tel" placeholder="300 000 0000" className={campo} />
      </div>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-tinta-2">
        <input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" />
        <span>
          Acepto los <Link href="/terminos" target="_blank" className="underline">términos de uso</Link> y autorizo el tratamiento de mis datos (nombre, WhatsApp y ubicación) para contactar al proveedor y que me escriba por WhatsApp, según la{" "}
          <Link href="/privacidad" target="_blank" className="underline">política de tratamiento de datos</Link>.
        </span>
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>
      {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
      <button type="submit" disabled={enviando} className="flex h-13 items-center justify-center rounded-campo bg-verde px-6 text-base font-semibold text-white hover:bg-verde-oscuro disabled:opacity-60">
        {enviando ? "Un momento…" : "Continuar a WhatsApp"}
      </button>
    </form>
  );
}
