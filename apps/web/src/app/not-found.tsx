import Link from "next/link";
import { CATEGORIAS } from "@las3b/shared";

export const metadata = { title: { absolute: "Página no encontrada | LasTresB" }, robots: { index: false, follow: true } };

/** 404 útil: en vez de un callejón sin salida, ofrece buscar y las categorías principales (menos rebote, más rastreo interno). */
export default function NoEncontrada() {
  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-6 px-5 py-14 sm:py-20">
      <p className="font-display text-6xl font-extrabold text-verde">404</p>
      <h1 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-4xl">No encontramos esa página</h1>
      <p className="text-base leading-normal text-tinta-2">Puede que el enlace esté mal escrito o que el proveedor ya no esté disponible. Busca de nuevo o entra por una categoría.</p>
      <form action="/buscar" role="search" className="flex flex-col gap-2 sm:flex-row">
        <input name="q" type="search" aria-label="Servicio o clase" placeholder="Ej: plomero, clases de inglés" className="h-13 flex-1 rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base" />
        <button type="submit" className="h-13 rounded-campo bg-tinta px-7 text-base font-semibold text-white">Buscar</button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <li key={c.slug}><Link href={`/categorias/${c.slug}`} className="flex h-11 items-center rounded-full border border-borde bg-white px-4 text-[15px] font-medium text-tinta">{c.nombre}</Link></li>
        ))}
        <li><Link href="/" className="flex h-11 items-center rounded-full bg-tinta px-4 text-[15px] font-semibold text-white">Ir al inicio</Link></li>
      </ul>
    </main>
  );
}