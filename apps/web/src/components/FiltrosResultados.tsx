import Link from "next/link";
import { LOCALIDADES_BOGOTA, LOCALIDADES_VECINAS, type LocalidadSlug } from "@las3b/shared";
import { RangoPrecio } from "@/components/RangoPrecio";
import { INSIGNIAS_FILTRO, type InsigniaFiltro } from "@/lib/busqueda";

const ETIQUETA_INSIGNIA: Record<InsigniaFiltro, string> = {
  verificado: "Identidad verificada",
  formalizado: "Formalizado (con RUT)",
  certificado: "Certificado en su oficio",
  apto_menores: "Apto para menores",
};

export type ValoresFiltro = {
  q?: string;
  localidad?: string;
  categoria?: string;
  orden?: string;
  insignias: InsigniaFiltro[];
  cal: string;
  precioMax?: number;
  tambien: string[];
};

const casilla = "size-[18px] accent-verde";
const grupo = "flex flex-col gap-2.5";
const legenda = "mb-2.5 text-sm font-bold";

/** Filtros de resultados (mockup Resultados_web, columna izquierda; en móvil se abre con «Filtros»). Formulario GET sin JavaScript. */
export function FiltrosResultados({ prefijo, valores, limpiar }: { prefijo: string; valores: ValoresFiltro; limpiar: string }) {
  const vecinas = valores.localidad && valores.localidad in LOCALIDADES_VECINAS ? LOCALIDADES_VECINAS[valores.localidad as LocalidadSlug] : [];
  const nombreLocalidad = (s: string) => LOCALIDADES_BOGOTA.find((l) => l.slug === s)?.nombre ?? s;

  return (
    <form action="/buscar" className="flex flex-col gap-5 rounded-[22px] border border-borde-suave bg-white p-5" aria-label="Filtros">
      {valores.q && <input type="hidden" name="q" value={valores.q} />}
      {valores.localidad && <input type="hidden" name="localidad" value={valores.localidad} />}
      {valores.categoria && <input type="hidden" name="categoria" value={valores.categoria} />}
      {valores.orden && <input type="hidden" name="orden" value={valores.orden} />}

      <div className="flex items-center justify-between">
        <b className="font-display text-xl">Filtros</b>
        <Link href={limpiar} className="inline-flex min-h-11 items-center text-sm font-semibold text-verde hover:text-verde-oscuro">Limpiar</Link>
      </div>

      <fieldset className={grupo}>
        <legend className={legenda}>Confianza</legend>
        {INSIGNIAS_FILTRO.map((clave) => (
          <label key={clave} className="flex min-h-9 items-center gap-2.5 text-[15px]">
            <input type="checkbox" name="insignia" value={clave} defaultChecked={valores.insignias.includes(clave)} className={casilla} />
            {ETIQUETA_INSIGNIA[clave]}
          </label>
        ))}
      </fieldset>

      <fieldset className={grupo}>
        <legend className={legenda}>Calificación</legend>
        {[
          { v: "0", t: "Cualquiera" },
          { v: "4", t: "4 estrellas o más" },
          { v: "4.5", t: "4,5 estrellas o más" },
        ].map((o) => (
          <label key={o.v} className="flex min-h-9 items-center gap-2.5 text-[15px]">
            <input type="radio" name="cal" value={o.v} defaultChecked={valores.cal === o.v} className={casilla} />
            {o.t}
          </label>
        ))}
      </fieldset>

      <RangoPrecio id={`${prefijo}-precio`} valorInicial={valores.precioMax} />

      {vecinas.length > 0 && (
        <fieldset className={grupo}>
          <legend className={legenda}>También en localidades vecinas</legend>
          {vecinas.map((s) => (
            <label key={s} className="flex min-h-9 items-center gap-2.5 text-[15px]">
              <input type="checkbox" name="tambien" value={s} defaultChecked={valores.tambien.includes(s)} className={casilla} />
              {nombreLocalidad(s)}
            </label>
          ))}
        </fieldset>
      )}

      <button type="submit" className="h-12 rounded-campo bg-tinta text-[15px] font-semibold text-white">Aplicar filtros</button>
    </form>
  );
}
