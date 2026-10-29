import Link from "next/link";
import { CATEGORIAS } from "@las3b/shared";
import { Icono, OficiosAgrupados, TARJETA } from "@/components/categorias/Piezas";

/**
 * Celular: acordeón de las 4 categorías. Usa <details name="..."> (abrir una cierra las demás, Hogar abierta):
 * los enlaces siempre están en el HTML aunque esté cerrado. Debe ir dentro de ZonaMovil para los filtros rápidos.
 */
export function AcordeonMovil() {
  return (
    <div className="flex flex-col gap-2.5">
      {CATEGORIAS.map((c, i) => (
        <details key={c.slug} name="categorias-movil" open={i === 0} className={`group/acc ${TARJETA}`}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
            <Icono icono={c.icono} className="size-7 flex-none" />
            <span className="flex-1">{c.nombre}</span>
            <svg className="size-5 flex-none transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </summary>
          <div className="flex flex-col gap-3 px-4 pb-4">
            <OficiosAgrupados c={c} claseUrgencias />
            <Link href={`/categorias/${c.slug}`} className="inline-flex min-h-11 items-center self-end text-sm font-semibold underline underline-offset-4">Ver todo</Link>
          </div>
        </details>
      ))}
    </div>
  );
}