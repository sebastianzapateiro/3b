"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { CATEGORIAS, LOCALIDADES_BOGOTA, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";

const campo = "h-12 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta";
const etiqueta = "text-[13px] font-semibold text-gris";

const sinTildes = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const OFICIOS = TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => ({ nombre: sub.nombre, clave: sinTildes(sub.nombre), palabras: sinTildes(sub.claves).split(/[\s,]+/).filter(Boolean) }));
const MAX_SUGERENCIAS = 6;

/** Sugerencias de oficios desde la 2.ª letra: primero los que empiezan por lo escrito, luego los que tienen una palabra que empieza así. */
function sugerir(texto: string) {
  const t = sinTildes(texto);
  if (t.length < 2) return [];
  const empieza = OFICIOS.filter((o) => o.clave.startsWith(t));
  const palabra = OFICIOS.filter((o) => !o.clave.startsWith(t) && (o.clave.split(/\s+/).some((w) => w.startsWith(t)) || o.palabras.some((w) => w.startsWith(t))));
  return [...empieza, ...palabra].slice(0, MAX_SUGERENCIAS).map((o) => o.nombre);
}

/**
 * Buscador «¿Qué estás buscando?» del inicio (CU-01). Pide lo que se busca y la ubicación del servicio
 * (por localidad o exacta); no pide datos personales. La solicitud queda guardada (/api/v1/solicitudes) y al pulsar
 * «Contactar por WA» se piden nombre, WhatsApp y la autorización de datos (/contactar) antes de armar el mensaje.
 */
export function BuscadorInicio() {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<"localidad" | "exacta">("localidad");
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicando, setUbicando] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState<"sugerencias" | "categorias" | null>(null);
  const [activa, setActiva] = useState(-1);
  const sugerencias = sugerir(texto);
  const elegir = (v: string) => { setTexto(v); setAbierto(null); setActiva(-1); };

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (abierto !== "sugerencias" || !sugerencias.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva((a) => (a + 1) % sugerencias.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva((a) => (a <= 0 ? sugerencias.length - 1 : a - 1)); }
    else if (e.key === "Enter" && activa >= 0) { e.preventDefault(); elegir(sugerencias[activa]!); }
    else if (e.key === "Escape") setAbierto(null);
  }

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
    if (texto.length < 2) return setError("Escribe qué estás buscando o elige una categoría.");
    if (modo === "localidad" && !localidad) return setError("Elige la localidad donde necesitas el servicio.");
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/v1/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          ubicacion: modo,
          localidad: modo === "localidad" ? localidad : undefined,
          direccion: modo === "exacta" ? String(f.get("direccion") ?? "").trim() || undefined : undefined,
          lat: modo === "exacta" ? punto?.lat : undefined,
          lng: modo === "exacta" ? punto?.lng : undefined,
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
      router.push(`/proveedores?${params}`);
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
    <form onSubmit={enviar} className="flex flex-col gap-3.5 rounded-[22px] bg-white p-4 text-left shadow-[0_16px_48px_rgba(27,38,35,0.16)] sm:rounded-[24px] sm:p-5" noValidate>
      <div className={`grid gap-3.5 ${modo === "localidad" ? "sm:grid-cols-[minmax(0,1fr)_260px]" : ""}`}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className={etiqueta}>¿Qué estás buscando?</label>
          <div className="relative">
            <input
              id={`${id}-q`} name="q" type="search" required maxLength={500} autoComplete="off" role="combobox" aria-expanded={abierto === "sugerencias" && sugerencias.length > 0} aria-controls={`${id}-lista`} aria-autocomplete="list"
              value={texto} onChange={(e) => { setTexto(e.target.value); setAbierto("sugerencias"); setActiva(-1); }} onKeyDown={teclas} onBlur={() => setTimeout(() => setAbierto((a) => (a === "sugerencias" ? null : a)), 120)}
              placeholder="Ej: plomero, clases de química para mi hijo" className={`${campo} pr-12`}
            />
            <button type="button" onClick={() => setAbierto((a) => (a === "categorias" ? null : "categorias"))} aria-expanded={abierto === "categorias"} aria-label="Ver categorías" title="Ver categorías" className="absolute right-1.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-tinta-2 hover:bg-piedra">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={abierto === "categorias" ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {abierto === "sugerencias" && sugerencias.length > 0 && (
              <ul id={`${id}-lista`} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-campo border border-borde-campo bg-white py-1 shadow-[0_12px_32px_rgba(27,38,35,0.16)]">
                {sugerencias.map((o, i) => (
                  <li key={o} role="option" aria-selected={i === activa}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(o)} className={`flex min-h-11 w-full items-center px-3.5 text-left text-[15px] ${i === activa ? "bg-piedra" : "hover:bg-piedra"}`}>{o}</button>
                  </li>
                ))}
              </ul>
            )}
            {abierto === "categorias" && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-campo border border-borde-campo bg-white p-3 shadow-[0_12px_32px_rgba(27,38,35,0.16)]">
                {CATEGORIAS.map((c) => (
                  <div key={c.slug} className="py-2 first:pt-0 last:pb-0">
                    <p className="mb-1.5 text-[13px] font-bold text-tinta">{c.nombre}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.subcategorias.map((s) => (
                        <button key={s.slug} type="button" onClick={() => elegir(s.nombre)} className="min-h-9 rounded-full border border-borde-campo bg-white px-3 text-sm hover:bg-piedra">{s.nombre}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {modo === "localidad" && (
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-loc`} className={etiqueta}>Localidad</label>
            <select id={`${id}-loc`} name="localidad" defaultValue="" className={campo}>
              <option value="" disabled>Elige tu localidad</option>
              {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:gap-4">
        <fieldset className="flex min-w-0 flex-1 flex-col gap-2">
          <legend className={`${etiqueta} mb-1.5`}>Ubicación para el servicio</legend>
          <div className="flex flex-col gap-2 sm:flex-row">{opcion("localidad", "Por localidad")}{opcion("exacta", "Por dirección exacta")}</div>
        </fieldset>
        <button type="submit" disabled={enviando} className="flex h-12 w-full items-center justify-center gap-2 rounded-campo bg-ladrillo px-6 text-base font-semibold text-white hover:bg-ladrillo-oscuro disabled:opacity-60 sm:w-[190px] sm:flex-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          {enviando ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {modo === "exacta" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-dir`} className="text-sm text-tinta-2">Escribe la dirección o el lugar donde necesitas el servicio. La compartimos con el proveedor para que te cotice.</label>
          <input id={`${id}-dir`} name="direccion" maxLength={200} autoComplete="street-address" placeholder="Ej: Calle 80 # 20-30, Barrios Unidos" className={campo} />
          <button type="button" onClick={usarMiUbicacion} className="self-start text-sm font-semibold text-verde underline">Usar mi ubicación actual</button>
          {ubicando && <span role="status" className="text-sm text-gris">{ubicando}</span>}
        </div>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>

      {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
    </form>
  );
}