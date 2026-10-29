import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS } from "@las3b/shared";
import { FOTO_CATEGORIA, ordenar } from "@/components/categorias/Piezas";
import { IconoCategoria } from "@/components/CategoriaVisual";

/**
 * Celular: galería de tarjetas grandes con foto, título y chips encima (modelo «Galería visual de tarjetas grandes»),
 * en los colores de LasTresB. Debe ir dentro de ZonaMovil: «Urgente» y «24 h» muestran solo los oficios que atienden urgencias.
 */
export function GaleriaMovil() {
  return (
    <div className="flex flex-col gap-4">
      {CATEGORIAS.map((c, orden) => {
        const foto = FOTO_CATEGORIA[c.slug];
        return (
          <section key={c.slug} aria-labelledby={`g-${c.slug}`} className="relative isolate flex min-h-[250px] flex-col justify-end overflow-hidden rounded-[22px] bg-ladrillo shadow-[0_8px_30px_rgba(27,38,35,0.12)]">
            {foto ? (
              <Image src={foto} alt="" fill sizes="(max-width: 768px) 100vw, 400px" priority={orden === 0} className="-z-20 object-cover" />
            ) : (
              <IconoCategoria icono={c.icono} className="absolute right-5 top-5 -z-20 size-28 text-white/25" />
            )}
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-tinta/95 via-tinta/55 to-tinta/10" />
            <div className="flex flex-col gap-3 p-4">
              <h2 id={`g-${c.slug}`} className="font-display text-2xl font-extrabold leading-tight text-white">
                <Link href={`/categorias/${c.slug}`} className="hover:underline">{c.nombre}</Link>
              </h2>
              <ul className="flex flex-wrap gap-2">
                {ordenar(c.subcategorias).map((s, i) => (
                  <li key={s.slug} className={[i >= 4 ? "hidden" : "", s.atiendeUrgencias ? (i >= 4 ? "group-data-[filtro=urgente]:flex" : "") : "group-data-[filtro=urgente]:hidden"].join(" ")}>
                    <Link href={`/servicios/${s.slug}`} className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25">
                      {s.nombre}
                      {s.atiendeUrgencias && <span className="rounded-md bg-amarillo px-1.5 py-0.5 text-[11px] font-bold leading-none text-tinta">24 h</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={`/categorias/${c.slug}`} className="inline-flex min-h-11 items-center self-end text-sm font-bold text-white underline underline-offset-4">Ver todo ({c.subcategorias.length})</Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}