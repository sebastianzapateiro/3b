"use client";

/**
 * P2 · Panel de filtros de la búsqueda (CU-01): barra lateral en escritorio y hoja inferior en celular.
 * Escritorio: los resultados se actualizan al elegir cada filtro. Celular: se aplican con «Ver N proveedores».
 * Cada opción muestra cuántos proveedores tiene dentro de la búsqueda; las que tienen cero se atenúan.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXPLICACION_INSIGNIA,
  ETIQUETA_INSIGNIA,
  FILTROS_VACIOS,
  INSIGNIAS_FILTRO,
  TOPES_VISITA,
  etiquetaTope,
  paramsDesdeValores,
  type CalificacionFiltro,
  type ConteosFiltros,
  type InsigniaFiltro,
  type ValoresFiltros,
  type VisitaFiltro,
} from "@/lib/filtros";

type Props = {
  /** Parámetros que no son del panel (q, localidad, categoria, orden), ya serializados. */
  base: string;
  inicial: ValoresFiltros;
  mostrarNinos: boolean;
  vecinas: { slug: string; nombre: string }[];
  conteos: ConteosFiltros;
  /** Se muestra el grupo «Calificación» solo si algún proveedor de la búsqueda tiene reseñas suficientes. */
  mostrarCalificacion: boolean;
  /** Se llama al aplicar (la hoja se cierra). */
  alAplicar?: () => void;
};

const chipBase = "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";
const chipOn = "border-verde bg-verde-claro font-semibold text-verde-oscuro";
const chipOff = "border-borde-campo bg-white text-tinta hover:border-tinta";
const chipVacio = "cursor-not-allowed border-borde-suave bg-piedra text-gris";

function Marca() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>;
}

/** Chip con conteo. Sin resultados y sin estar activo: atenuado y no se puede pulsar. */
function Chip({ activo, onClick, cuenta, children }: { activo: boolean; onClick: () => void; cuenta?: number; children: React.ReactNode }) {
  const vacio = !activo && cuenta === 0;
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-disabled={vacio || undefined}
      onClick={vacio ? undefined : onClick}
      className={`${chipBase} ${activo ? chipOn : vacio ? chipVacio : chipOff}`}
    >
      {activo && <Marca />}
      {children}
      {cuenta !== undefined && <span className={activo ? "" : "font-normal"}>({cuenta})</span>}
    </button>
  );
}

export function PanelFiltros({ base, inicial, mostrarNinos, vecinas, conteos, mostrarCalificacion, alAplicar, modo }: Props & { modo: "escritorio" | "hoja" }) {
  const router = useRouter();
  const idDefiniciones = useId();
  const [v, setV] = useState<ValoresFiltros>(inicial);
  const [total, setTotal] = useState<number | null>(null);
  const [definiciones, setDefiniciones] = useState(false);

  useEffect(() => setV(inicial), [inicial]);

  // Conteo en vivo (solo en la hoja del celular, donde alimenta el botón).
  useEffect(() => {
    if (modo !== "hoja") return;
    const control = new AbortController();
    const espera = setTimeout(() => {
      const p = paramsDesdeValores(v, new URLSearchParams(base));
      fetch(`/api/v1/buscar/conteo?${p}`, { signal: control.signal })
        .then((r) => r.json())
        .then((d: { total: number }) => setTotal(d.total))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [v, base, modo]);

  /** En escritorio cada cambio navega; en la hoja solo actualiza el borrador. */
  const cambiar = (parcial: Partial<ValoresFiltros>) => {
    const nuevo = { ...v, ...parcial };
    setV(nuevo);
    if (modo === "escritorio") router.push(`/proveedores?${paramsDesdeValores(nuevo, new URLSearchParams(base))}`, { scroll: false });
  };
  const alternarInsignia = (c: InsigniaFiltro) =>
    cambiar({ insignias: v.insignias.includes(c) ? v.insignias.filter((i) => i !== c) : [...v.insignias, c] });
  const alternarVecina = (s: string) => cambiar({ tambien: v.tambien.includes(s) ? v.tambien.filter((t) => t !== s) : [...v.tambien, s] });

  const aplicar = () => {
    router.push(`/proveedores?${paramsDesdeValores(v, new URLSearchParams(base))}`);
    alAplicar?.();
  };
  const hayFiltros = v.insignias.length > 0 || v.cal !== "0" || v.visita !== "" || v.hoy || v.h24 || v.tambien.length > 0;
  const limpiar = () => cambiar({ ...FILTROS_VACIOS, tambien: [] });

  const insigniasVisibles = INSIGNIAS_FILTRO.filter((i) => i !== "apto_menores" || mostrarNinos);
  const calificaciones: { v: CalificacionFiltro; t: string; n?: number }[] = [
    { v: "0", t: "Todas" },
    { v: "4", t: "★ 4+", n: conteos.cal4 },
    { v: "4.5", t: "★ 4,5+", n: conteos.cal45 },
  ];
  const visitas: { v: VisitaFiltro; t: string; n?: number }[] = [
    { v: "", t: "Cualquiera" },
    ...TOPES_VISITA.map((t) => ({ v: String(t) as VisitaFiltro, t: etiquetaTope(t), n: conteos.visita[String(t)] ?? 0 })),
    { v: "convenir", t: "A convenir", n: conteos.visita.convenir ?? 0 },
  ];

  const grupo = "flex flex-col gap-2.5 border-0 p-0";
  const legenda = "mb-1 text-sm font-bold";

  const textoBoton =
    total === null
      ? "Ver proveedores"
      : total === 0
        ? hayFiltros ? "Sin resultados: prueba quitar un filtro" : "Ver proveedores"
        : `Ver ${total} ${total === 1 ? "proveedor" : "proveedores"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-none items-center justify-between">
        <b className="font-display text-xl">Filtros</b>
        <button
          type="button"
          onClick={limpiar}
          aria-disabled={!hayFiltros || undefined}
          className={`inline-flex min-h-11 items-center text-sm font-semibold ${hayFiltros ? "text-verde hover:text-verde-oscuro" : "cursor-not-allowed text-gris opacity-70"}`}
        >
          Limpiar
        </button>
      </div>

      {/* Desplazamiento propio: ningún chip queda tapado por el botón fijo del celular. */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4 pr-1">
        <div role="group" aria-label="Quiero que el proveedor tenga" className={grupo}>
          <div className={`${legenda} flex flex-wrap items-baseline justify-between gap-x-3`}>
            <span>Quiero que el proveedor tenga</span>
            <button type="button" aria-expanded={definiciones} aria-controls={idDefiniciones} onClick={() => setDefiniciones((a) => !a)} className="text-[13px] font-semibold text-verde underline">
              ¿Qué significa cada uno?
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {insigniasVisibles.map((c) => (
              <Chip key={c} activo={v.insignias.includes(c)} onClick={() => alternarInsignia(c)} cuenta={conteos.insignias[c]}>{ETIQUETA_INSIGNIA[c]}</Chip>
            ))}
          </div>
          {definiciones && (
            <dl id={idDefiniciones} className="flex flex-col gap-1.5 rounded-xl bg-piedra px-3 py-2.5 text-[13px] leading-snug text-tinta-2">
              {insigniasVisibles.map((c) => (
                <div key={c}><dt className="inline font-semibold">{ETIQUETA_INSIGNIA[c]}: </dt><dd className="inline">{EXPLICACION_INSIGNIA[c]}</dd></div>
              ))}
            </dl>
          )}
        </div>

        {(mostrarCalificacion || v.cal !== "0") && (
          <div role="group" aria-label="Calificación" className={grupo}>
            <span className={legenda}>Calificación</span>
            <div className="flex flex-wrap gap-2">
              {calificaciones.map((o) => <Chip key={o.v} activo={v.cal === o.v} onClick={() => cambiar({ cal: o.v })} cuenta={o.n}>{o.t}</Chip>)}
            </div>
          </div>
        )}

        <div role="group" aria-label="Precio de la visita" className={grupo}>
          <span className={legenda}>Precio de la visita</span>
          <p className="text-[13px] leading-snug text-gris">La visita es lo que cobra el proveedor por ir, revisar y cotizar. Algunos la acuerdan contigo, por ejemplo si están cerca.</p>
          <div className="flex flex-wrap gap-2">
            {visitas.map((o) => <Chip key={o.v || "todas"} activo={v.visita === o.v} onClick={() => cambiar({ visita: o.v })} cuenta={o.n}>{o.t}</Chip>)}
          </div>
        </div>

        <div role="group" aria-label="Disponibilidad" className={grupo}>
          <span className={legenda}>Disponibilidad</span>
          <div className="flex flex-wrap gap-2">
            <Chip activo={v.hoy} onClick={() => cambiar({ hoy: !v.hoy })} cuenta={conteos.hoy}>Urgente hoy</Chip>
            <Chip activo={v.h24} onClick={() => cambiar({ h24: !v.h24 })} cuenta={conteos.h24}>24 horas</Chip>
          </div>
        </div>

        {vecinas.length > 0 && (
          <div role="group" aria-label="También en localidades vecinas" className={grupo}>
            <span className={legenda}>También en localidades vecinas</span>
            <div className="flex flex-wrap gap-2">
              {vecinas.map((s) => <Chip key={s.slug} activo={v.tambien.includes(s.slug)} onClick={() => alternarVecina(s.slug)}>{s.nombre}</Chip>)}
            </div>
          </div>
        )}
      </div>

      {modo === "hoja" && (
        <div className="flex-none border-t border-borde-suave bg-white pt-3">
          <button
            type="button"
            onClick={total === 0 && hayFiltros ? undefined : aplicar}
            aria-disabled={(total === 0 && hayFiltros) || undefined}
            className={`min-h-12 w-full rounded-campo px-4 py-2 text-[15px] font-semibold leading-tight ${total === 0 && hayFiltros ? "cursor-not-allowed border border-borde-campo bg-piedra text-tinta" : "bg-tinta text-white"}`}
          >
            {textoBoton}
          </button>
        </div>
      )}
    </div>
  );
}

/** Botón «Filtros» + hoja inferior (celular). */
export function HojaFiltros({ activos, ...props }: Props & { activos: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-tinta px-5 text-[15px] font-semibold text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
        Filtros{activos > 0 ? ` (${activos})` : ""}
      </button>
      <dialog
        ref={ref}
        aria-label="Filtros"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none flex-col overflow-hidden rounded-t-[24px] bg-white p-5 backdrop:bg-black/40 open:flex"
      >
        <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar filtros" className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full text-tinta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <PanelFiltros {...props} modo="hoja" alAplicar={() => ref.current?.close()} />
      </dialog>
    </>
  );
}
