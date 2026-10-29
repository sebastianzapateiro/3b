import { LOCALIDADES_BOGOTA } from "@las3b/shared";

/** Buscador «¿Qué necesitas?» con selector de localidad (por defecto Bogotá). Fijo bajo el menú en celular; un solo selector. */
export function BuscadorCategorias() {
  return (
    <form action="/buscar" role="search" className="sticky top-[72px] z-30 -mx-4 bg-crema px-4 py-2.5 md:static md:mx-auto md:max-w-[720px] md:bg-transparent md:p-0">
      <div className="flex gap-2 md:gap-2.5 md:rounded-xl md:bg-white md:p-2 md:shadow-[0_1px_3px_rgba(27,38,35,0.08)] md:ring-1 md:ring-borde-suave">
        <label htmlFor="c-q" className="sr-only">¿Qué necesitas?</label>
        <input id="c-q" name="q" type="search" placeholder="¿Qué necesitas?" className="h-12 min-w-0 flex-1 rounded-lg border border-borde-campo bg-white px-3.5 text-base md:border-0" />
        <label htmlFor="c-loc" className="sr-only">Localidad</label>
        <select id="c-loc" name="localidad" defaultValue="" className="h-12 w-36 flex-none rounded-lg border border-borde-campo bg-white px-2.5 text-base md:w-44 md:border-0 md:border-l md:rounded-none">
          <option value="">Bogotá</option>
          {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
        </select>
        <button type="submit" className="hidden h-12 rounded-campo bg-tinta px-6 text-base font-semibold text-white md:block">Buscar</button>
      </div>
    </form>
  );
}