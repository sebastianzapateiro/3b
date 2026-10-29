"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS, CENTROS_LOCALIDADES, LOCALIDADES_BOGOTA, type LocalidadSlug } from "@las3b/shared";

type Filtro = "urgente" | "24h" | null;

const chip = "flex h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-sm font-medium";

/**
 * Celular: chips rápidos y envoltorio del acordeón.
 * «Urgente» y «24 h» filtran en la misma página los oficios que atienden urgencias (sin recargar);
 * «Cerca» pide la ubicación; «Filtros» abre una hoja inferior y lleva a la búsqueda.
 */
export function ZonaMovil({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hoja = useRef<HTMLDialogElement>(null);
  const [filtro, setFiltro] = useState<Filtro>(null);
  const [mensaje, setMensaje] = useState("");
  const [hojaUrgente, setHojaUrgente] = useState(false);

  function alternar(f: Exclude<Filtro, null>) {
    setFiltro((actual) => (actual === f ? null : f));
  }

  function cerca() {
    if (!navigator.geolocation) return setMensaje("Tu navegador no permite usar la ubicación.");
    setMensaje("Buscando tu localidad…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const mejor = (Object.entries(CENTROS_LOCALIDADES) as [LocalidadSlug, [number, number]][])
          .map(([slug, [lat, lng]]) => ({ slug, d: (lat - coords.latitude) ** 2 + (lng - coords.longitude) ** 2 }))
          .sort((a, b) => a.d - b.d)[0]!;
        router.push(`/buscar?localidad=${mejor.slug}`);
      },
      () => setMensaje("No pudimos usar tu ubicación. Elige tu localidad en «Filtros»."),
      { timeout: 8000 },
    );
  }

  function aplicarHoja(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    for (const k of ["categoria", "localidad"]) if (d.get(k)) p.set(k, String(d.get(k)));
    if (hojaUrgente) p.set("urgente", "1");
    hoja.current?.close();
    router.push(`/buscar?${p}`);
  }

  return (
    <div data-filtro={filtro ?? undefined} className="group flex flex-col gap-3">
      <div role="group" aria-label="Filtros rápidos" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" aria-pressed={filtro === "urgente"} onClick={() => alternar("urgente")} className={`${chip} ${filtro === "urgente" ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white text-tinta"}`}>Urgente</button>
        <button type="button" aria-pressed={filtro === "24h"} onClick={() => alternar("24h")} className={`${chip} ${filtro === "24h" ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white text-tinta"}`}>24 h</button>
        <button type="button" onClick={cerca} className={`${chip} border-borde-campo bg-white text-tinta`}>Cerca</button>
        <button type="button" onClick={() => hoja.current?.showModal()} className={`${chip} border-borde-campo bg-white text-tinta`}>Filtros</button>
      </div>
      {mensaje && <p role="status" className="text-sm text-gris">{mensaje}</p>}
      {filtro && <p className="text-sm text-gris">Mostrando solo los oficios cuyos proveedores suelen atender urgencias. <button type="button" onClick={() => setFiltro(null)} className="inline-flex min-h-11 items-center font-semibold text-tinta underline">Quitar filtro</button></p>}
      {children}

      <dialog ref={hoja} aria-label="Filtros" className="m-0 mt-auto w-full max-w-none rounded-t-2xl border-0 bg-white p-0 backdrop:bg-black/40 open:flex open:flex-col">
        <form onSubmit={aplicarHoja} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Filtros</h2><button type="button" onClick={() => hoja.current?.close()} aria-label="Cerrar" className="flex size-11 items-center justify-center text-2xl">×</button></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="h-cat" className="text-sm font-semibold">Categoría</label><select id="h-cat" name="categoria" className="h-12 rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base"><option value="">Todas</option>{CATEGORIAS.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="h-loc" className="text-sm font-semibold">Localidad</label><select id="h-loc" name="localidad" className="h-12 rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base"><option value="">Toda Bogotá</option>{LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}</select></div>
          <label className="flex min-h-11 items-center justify-between gap-3 text-[15px]">Atienden urgencias<input type="checkbox" role="switch" checked={hojaUrgente} onChange={(e) => setHojaUrgente(e.target.checked)} className="size-6 accent-verde" /></label>
          <label className="flex min-h-11 items-center justify-between gap-3 text-[15px]">Atienden 24 horas<input type="checkbox" role="switch" checked={hojaUrgente} onChange={(e) => setHojaUrgente(e.target.checked)} className="size-6 accent-verde" /></label>
          <button type="submit" className="h-12 rounded-campo bg-tinta text-base font-semibold text-white">Ver resultados</button>
        </form>
      </dialog>
    </div>
  );
}