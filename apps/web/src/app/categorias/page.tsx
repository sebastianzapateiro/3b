import type { Metadata } from "next";
import { CATEGORIAS, TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { GaleriaMovil } from "@/components/categorias/GaleriaMovil";
import { BuscadorCategorias } from "@/components/categorias/Buscador";
import { FONDO_NEUTRO, TarjetaCategoria, TarjetaProveedores } from "@/components/categorias/Piezas";
import { ZonaMovil } from "@/components/categorias/ZonaMovil";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { FAQ_CATEGORIAS } from "@/lib/faqs";
import { jsonLdLista, jsonLdMigas, meta } from "@/lib/seo";

/** Explorar categorías y oficios (P2, CU-03). Una sola página responsive. Datos: CATEGORIAS de @las3b/shared. */
export const metadata: Metadata = meta({
  titulo: "Categorías de servicios en Bogotá",
  descripcion: "Plomería, electricidad, clases, trasteos, fletes y más. Encuentra proveedores verificados en Bogotá, recomendados por quienes ya los contrataron.",
  ruta: "/categorias",
});


export default function Categorias() {
  return (
    <div className={FONDO_NEUTRO}>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Categorías", ruta: "/categorias" }])} />
      <JsonLd datos={jsonLdLista("Categorías y oficios en Bogotá", [...CATEGORIAS.map((c) => ({ nombre: c.nombre, ruta: `/categorias/${c.slug}` })), ...TODAS_LAS_SUBCATEGORIAS.map(({ sub }) => ({ nombre: sub.nombre, ruta: `/servicios/${sub.slug}` }))])} />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-10 pt-6 sm:px-6 md:gap-8 md:pt-12">
        <header className="flex flex-col gap-2 md:items-center md:text-center">
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.8px] md:text-5xl md:tracking-[-1.5px]">Explorar categorías de servicios</h1>
          <p className="text-base text-tinta-2 md:text-lg">Encuentra proveedores locales verificados</p>
        </header>

        <BuscadorCategorias />

        {/* Celular: chips rápidos y galería de tarjetas con foto */}
        <div className="md:hidden"><ZonaMovil><GaleriaMovil /></ZonaMovil></div>

        {/* Tablet 2 × 2 y escritorio 4 en fila, todas del mismo alto */}
        <div className="hidden items-stretch gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => <TarjetaCategoria key={c.slug} c={c} />)}
        </div>

        <TarjetaProveedores />
      </main>
      <Faq preguntas={FAQ_CATEGORIAS} lateral />
    </div>
  );
}