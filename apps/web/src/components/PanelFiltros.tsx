"use client";

/**
 * P2 · Panel de filtros de la búsqueda (CU-01): barra lateral en escritorio y hoja inferior en celular.
 * El conteo «Ver N proveedores» se actualiza en vivo; los filtros se aplican al pulsar ese botón.
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
  /** Se llama al aplicar (la hoja se cierra). */
  alAplicar?: () => void;
};

const chipBase = "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors";
const chipOn = "border-verde bg-verde-claro font-semibold text-verde-oscuro";
const chipOff = "border-borde-campo bg-white text-tinta";

function Marca() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>;
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick} className={`${chipBase} ${activo ? chipOn : chipOff}`}>
      {activo && <Marca />}
      {children}
    </button>
  );
}

/** Insignia con ícono «i» que despliega una línea de explicación. */
function ChipInsignia({ clave, activo, alternar }: { clave: InsigniaFiltro; activo: boolean; alternar: () => void }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Chip activo={activo} onClick={alternar}>{ETIQUETA_INSIGNIA[clave]}</Chip>
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={id}
          aria-label={`Qué significa «${ETIQUETA_INSIGNIA[clave]}»`}
          onClick={() => setAbierta((a) => !a)}
          className="flex size-11 items-center justify-center rounded-full text-gris hover:text-tinta"
        >
          <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full border border-current text-xs font-bold italic">i</span>
        </button>
      </div>
      {abierta && <p id={id} className="rounded-xl bg-piedra px-3 py-2 text-[13px] leading-snug text-tinta-2">{EXPLICACION_INSIGNIA[clave]}</p>}
    </div>
  );
}

export function PanelFiltros({ base, inicial, mostrarNinos, vecinas, alAplicar }: Props) {
  const router = useRouter();
  const [v, setV] = useState<ValoresFiltros>(inicial);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => setV(inicial), [inicial]);

  // Conteo en vivo con una pequeña espera para no consultar en cada toque.
  useEffect(() => {
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
  }, [v, base]);

  const cambiar = (parcial: Partial<ValoresFiltros>) => setV((a) => ({ ...a, ...parcial }));
  const alternarInsignia = (c: InsigniaFiltro) =>
    cambiar({ insignias: v.insignias.includes(c) ? v.insignias.filter((i) => i !== c) : [...v.insignias, c] });
  const alternarVecina = (s: string) => cambiar({ tambien: v.tambien.includes(s) ? v.tambien.filter((t) => t !== s) : [...v.tambien, s] });

  const aplicar = () => {
    router.push(`/buscar?${paramsDesdeValores(v, new URLSearchParams(base))}`);
    alAplicar?.();
  };
  const limpiar = () => setV({ ...FILTROS_VACIOS, tambien: [] });

  const insigniasVisibles = INSIGNIAS_FILTRO.filter((i) => i !== "apto_menores" || mostrarNinos);
  const calificaciones: { v: CalificacionFiltro; t: string }[] = [
    { v: "0", t: "Cualquiera" },
    { v: "4", t: "★ 4 o más" },
    { v: "4.5", t: "★ 4,5 o más" },
  ];
  const visitas: { v: VisitaFiltro; t: string }[] = [
    { v: "", t: "Cualquiera" },
    ...TOPES_VISITA.map((t) => ({ v: String(t) as VisitaFiltro, t: etiquetaTope(t) })),
    { v: "convenir", t: "A convenir con el proveedor" },
  ];

  const grupo = "flex flex-col gap-2.5 border-0 p-0";
  const legenda = "mb-1 text-sm font-bold";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <b className="font-display text-xl">Filtros</b>
        <button type="button" onClick={limpiar} className="inline-flex min-h-11 items-center text-sm font-semibold text-verde hover:text-verde-oscuro">Limpiar</button>
      </div>

      <fieldset className={grupo}>
        <legend className={legenda}>Quiero que el proveedor tenga</legend>
        {insigniasVisibles.map((c) => (
          <ChipInsignia key={c} clave={c} activo={v.insignias.includes(c)} alternar={() => alternarInsignia(c)} />
        ))}
      </fieldset>

      <fieldset className={grupo}>
        <legend className={legenda}>Calificación</legend>
        <div className="flex flex-wrap gap-2">
          {calificaciones.map((o) => <Chip key={o.v} activo={v.cal === o.v} onClick={() => cambiar({ cal: o.v })}>{o.t}</Chip>)}
        </div>
      </fieldset>

      <fieldset className={grupo}>
        <legend className={legenda}>Precio de la visita (revisar y cotizar)</legend>
        <div className="flex flex-wrap gap-2">
          {visitas.map((o) => <Chip key={o.v || "todas"} activo={v.visita === o.v} onClick={() => cambiar({ visita: o.v })}>{o.t}</Chip>)}
        </div>
        <p className="text-[13px] leading-snug text-gris">Es solo la visita de revisión y cotización. El precio del trabajo lo acuerdan directamente con el proveedor.</p>
      </fieldset>

      <fieldset className={grupo}>
        <legend className={legenda}>Disponibilidad</legend>
        <div className="flex flex-wrap gap-2">
          <Chip activo={v.hoy} onClick={() => cambiar({ hoy: !v.hoy })}>Urgente hoy</Chip>
          <Chip activo={v.h24} onClick={() => cambiar({ h24: !v.h24 })}>24 horas</Chip>
        </div>
      </fieldset>

      {vecinas.length > 0 && (
        <fieldset className={grupo}>
          <legend className={legenda}>También en localidades vecinas</legend>
          <div className="flex flex-wrap gap-2">
            {vecinas.map((s) => <Chip key={s.slug} activo={v.tambien.includes(s.slug)} onClick={() => alternarVecina(s.slug)}>{s.nombre}</Chip>)}
          </div>
        </fieldset>
      )}

      <div className="sticky bottom-0 -mx-1 bg-white px-1 pb-1 pt-2">
        <button
          type="button"
          onClick={aplicar}
          disabled={total === 0}
          aria-live="polite"
          className="h-12 w-full rounded-campo bg-tinta text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-borde-campo disabled:text-gris"
        >
          {total === null ? "Ver proveedores" : total === 0 ? "Sin proveedores con estos filtros" : `Ver ${total} ${total === 1 ? "proveedor" : "proveedores"}`}
        </button>
        {total === 0 && <p className="mt-1.5 text-center text-[13px] text-gris">Quita algún filtro para ver resultados.</p>}
      </div>
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
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[24px] bg-white p-5 backdrop:bg-black/40"
      >
        <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar filtros" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-tinta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <PanelFiltros {...props} alAplicar={() => ref.current?.close()} />
      </dialog>
    </>
  );
}
