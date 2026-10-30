"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";

const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta";
const etiqueta = "text-[13px] font-semibold text-gris";

/**
 * Buscador «¿Qué estás buscando?» del inicio (CU-01). Además de lo que se busca pide la ubicación del servicio
 * (por localidad o exacta), el nombre y el WhatsApp, con la autorización de datos. La solicitud queda guardada
 * (/api/v1/solicitudes) y «Contactar por WA» la usa para armar el mensaje al proveedor.
 */
export function BuscadorInicio({ localidadInicial }: { localidadInicial: string }) {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<"localidad" | "exacta">("localidad");
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicando, setUbicando] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  function usarMiUbicacion() {
    if (!navigator.geolocation) return setUbicando("Tu navegador no permite usar la ubicación.");
    setUbicando("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPunto({ lat: coords.latitude, lng: coords.longitude });
        setUbicando("Listo: enviaremos tu ubicación actual.");
      },
      () => setUbicando("No pudimos usar tu ubicación. Escribe la dirección."),
      { timeout: 8000 },
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const texto = String(f.get("q") ?? "").trim();
    const localidad = String(f.get("localidad") ?? "");
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/v1/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          nombre: f.get("nombre"),
          whatsapp: f.get("whatsapp"),
          ubicacion: modo,
          localidad: modo === "localidad" ? localidad : undefined,
          direccion: modo === "exacta" ? String(f.get("direccion") ?? "").trim() || undefined : undefined,
          lat: modo === "exacta" ? punto?.lat : undefined,
          lng: modo === "exacta" ? punto?.lng : undefined,
          autoriza: f.get("autoriza") === "on",
          origen: "home",
          web: f.get("web"),
        }),
      });
      const j = await r.json();
      if (!r.ok) return setError(j.error ?? "No pudimos enviar tu solicitud. Intenta de nuevo.");
      if (j.prohibido) return setError("Ese servicio no está en LasTresB. Mira los que sí ofrecemos en categorías.");
      const params = new URLSearchParams({ q: texto, solicitud: "1" });
      if (modo === "localidad") params.set("localidad", localidad);
      else params.set("ubic", "exacta");
      router.push(`/buscar?${params}`);
    } catch {
      setError("No pudimos enviar tu solicitud. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const opcion = (v: "localidad" | "exacta", texto: string) => (
    <label className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-campo border-[1.5px] px-3 text-[15px] font-semibold ${modo === v ? "border-tinta bg-piedra" : "border-borde-campo bg-white text-tinta-2"}`}>
      <input type="radio" name="ubicacion" value={v} checked={modo === v} onChange={() => setModo(v)} className="size-[18px] accent-verde" />
      {texto}
    </label>
  );

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-[20px] bg-white p-3.5 shadow-[0_6px_24px_rgba(27,38,35,0.08)] sm:rounded-[22px] sm:p-4 sm:shadow-[0_8px_30px_rgba(27,38,35,0.08)]" noValidate>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={`${id}-q`} className={etiqueta}>¿Qué estás buscando?</label>
        <input id={`${id}-q`} name="q" type="search" required maxLength={500} placeholder="Ej: plomero, clases de química para mi hijo" className={campo} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${etiqueta} mb-1.5`}>Ubicación para el servicio</legend>
        <div className="flex flex-col gap-2 sm:flex-row">{opcion("localidad", "Por localidad")}{opcion("exacta", "Por ubicación exacta")}</div>
        {modo === "localidad" ? (
          <>
            <label htmlFor={`${id}-loc`} className="sr-only">Localidad</label>
            <select id={`${id}-loc`} name="localidad" defaultValue={localidadInicial} className={campo}>
              {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
            </select>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-dir`} className="text-sm text-tinta-2">Escribe la dirección o el lugar donde necesitas el servicio. La compartimos con el proveedor para que te cotice.</label>
            <input id={`${id}-dir`} name="direccion" maxLength={200} autoComplete="street-address" placeholder="Ej: Calle 80 # 20-30, Barrios Unidos" className={campo} />
            <button type="button" onClick={usarMiUbicacion} className="self-start text-sm font-semibold text-verde underline">Usar mi ubicación actual</button>
            {ubicando && <span role="status" className="text-sm text-gris">{ubicando}</span>}
          </div>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5"><label htmlFor={`${id}-nombre`} className={etiqueta}>Tu nombre</label><input id={`${id}-nombre`} name="nombre" required maxLength={80} autoComplete="given-name" className={campo} /></div>
        <div className="flex flex-col gap-1.5"><label htmlFor={`${id}-wa`} className={etiqueta}>Tu WhatsApp</label><input id={`${id}-wa`} name="whatsapp" type="tel" required inputMode="tel" autoComplete="tel" placeholder="300 000 0000" className={campo} /></div>
      </div>

      <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2">
        <input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" />
        <span>Acepto los <Link href="/terminos" target="_blank" className="font-semibold text-verde underline">términos de uso</Link> y autorizo el tratamiento de mis datos (nombre, WhatsApp y ubicación) para mostrarme proveedores y escribirme por WhatsApp, según la <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</Link>.</span>
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>

      {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
      <button type="submit" disabled={enviando} className="h-13 rounded-campo bg-tinta px-7 text-[17px] font-semibold text-white disabled:opacity-60 sm:self-start sm:text-base">{enviando ? "Buscando…" : "Buscar"}</button>
    </form>
  );
}
