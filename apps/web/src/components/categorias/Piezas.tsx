import Link from "next/link";
import type { CategoriaPadre, Subcategoria } from "@las3b/shared";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";

/** Piezas visuales de /categorias y /categorias/[slug], con la paleta de LasTresB (crema, verde, tinta, amarillo, ladrillo). */
export const FONDO_NEUTRO = "";
export const TARJETA = "rounded-[22px] border border-borde-suave bg-white shadow-[0_8px_30px_rgba(27,38,35,0.06)]";

/** Foto de cada categoría (banco de imágenes del proyecto, ver public/fotos/CREDITOS.md). Acarreos aún no tiene foto. */
export const FOTO_CATEGORIA: Record<string, string | undefined> = {
  hogar: "/fotos/hogar.jpg",
  "clases-y-refuerzo": "/fotos/clases.jpg",
  "servicios-varios": "/fotos/servicios-varios.jpg",
};

/** Los populares van primero dentro de su grupo; el resto conserva el orden de la taxonomía. */
export const ordenar = (lista: Subcategoria[]) => [...lista].sort((a, b) => Number(b.popular) - Number(a.popular));

/** Ícono de la categoría dentro de un recuadro con el color de la categoría (igual que en el Home). */
export function Icono({ icono, className = "size-14" }: { icono: CategoriaPadre["icono"]; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex flex-none items-center justify-center rounded-2xl ${TONO_CATEGORIA[icono]} ${className}`}>
      <IconoCategoria icono={icono} className="size-[58%]" />
    </span>
  );
}

/** Chip de oficio: enlace real a /servicios/[oficio], 14 px y 44 px de alto, etiqueta «24 h» si atiende urgencias. */
export function ChipOficio({ s, claseUrgencias = false }: { s: Subcategoria; claseUrgencias?: boolean }) {
  return (
    <li className={claseUrgencias && !s.atiendeUrgencias ? "group-data-[filtro=urgente]:hidden" : undefined}>
      <Link href={`/servicios/${s.slug}`} className="flex min-h-11 items-center gap-1.5 rounded-full border border-borde bg-crema px-4 text-sm font-medium text-tinta hover:border-verde hover:text-verde-oscuro">
        {s.nombre}
        {s.atiendeUrgencias && <span className="rounded-md bg-verde-claro px-1.5 py-0.5 text-[11px] font-bold leading-none text-verde-oscuro">24 h</span>}
      </Link>
    </li>
  );
}

/** Lista completa de oficios de una categoría; Hogar se agrupa bajo los títulos de sus subgrupos. */
export function OficiosAgrupados({ c, claseUrgencias = false }: { c: CategoriaPadre; claseUrgencias?: boolean }) {
  const grupos = [...new Set(c.subcategorias.map((s) => s.subgrupo).filter((g): g is string => Boolean(g)))];
  if (grupos.length === 0) {
    return <ul className="flex flex-wrap gap-2">{ordenar(c.subcategorias).map((s) => <ChipOficio key={s.slug} s={s} claseUrgencias={claseUrgencias} />)}</ul>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {grupos.map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[1px] text-gris">{g}</h3>
          <ul className="flex flex-wrap gap-2">{ordenar(c.subcategorias.filter((s) => s.subgrupo === g)).map((s) => <ChipOficio key={s.slug} s={s} claseUrgencias={claseUrgencias} />)}</ul>
        </div>
      ))}
    </div>
  );
}

/** Tarjeta de escritorio y tablet: ícono, título, 4 chips y «Ver todo» con «+N más». Todas del mismo alto. */
export function TarjetaCategoria({ c }: { c: CategoriaPadre }) {
  const primeros = ordenar(c.subcategorias).slice(0, 4);
  const mas = c.subcategorias.length - primeros.length;
  return (
    <section aria-labelledby={`t-${c.slug}`} className={`${TARJETA} flex h-full flex-col gap-4 p-5`}>
      <Icono icono={c.icono} className="size-16" />
      <h2 id={`t-${c.slug}`} className="font-display text-xl font-bold leading-tight"><Link href={`/categorias/${c.slug}`} className="hover:text-verde-oscuro">{c.nombre}</Link></h2>
      <ul className="flex flex-wrap gap-2">{primeros.map((s) => <ChipOficio key={s.slug} s={s} />)}</ul>
      <div className="mt-auto flex items-center justify-end gap-2.5 pt-1 text-sm">
        {mas > 0 && <span className="text-gris">+{mas} más</span>}
        <Link href={`/categorias/${c.slug}`} className="inline-flex min-h-11 items-center font-semibold text-verde hover:text-verde-oscuro">Ver todo</Link>
      </div>
    </section>
  );
}

/** Tarjeta oscura para proveedores (alta, CU-30), como la del Home. Solo promesas que existen. */
export function TarjetaProveedores() {
  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-tinta p-6 text-white sm:p-8">
      <h2 className="font-display text-2xl font-bold">¿Ofreces un servicio? Regístrate gratis</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-normal text-[#D5DCDA]">
        <li>Crea tu perfil sin costo.</li>
        <li>Recibe contactos por WhatsApp.</li>
        <li>Construye tu reputación con reseñas verificadas.</li>
      </ul>
      <Link href="/proveedores/registro" className="flex h-[52px] items-center justify-center self-start rounded-campo bg-amarillo px-7 text-base font-bold text-tinta max-sm:self-stretch">Registrar mi servicio</Link>
    </section>
  );
}