import Link from "next/link";
import { LOCALIDADES_BOGOTA, MARCA } from "@las3b/shared";
import { Logo } from "@/components/Logo";

/** Home (CU-01, CU-03). Diseño de referencia: lienzo "Las 3B — Mockups v0.3", tablero Home. */
const CATEGORIAS = [
  { nombre: "Hogar", detalle: "Plomería, electricidad, pintura, cerrajería", slug: "hogar", tono: "bg-verde-claro text-verde-oscuro" },
  { nombre: "Clases y refuerzo", detalle: "Matemáticas, inglés, música, tareas", slug: "clases-y-refuerzo", tono: "bg-amarillo-suave text-[#6B4E00]" },
  { nombre: "Acarreos", detalle: "Mudanzas de barrio, objetos pesados", slug: "acarreos", tono: "bg-ladrillo-suave text-[#8A2A18]" },
  { nombre: "Servicios varios", detalle: "Costura, mascotas, jardines, tecnología", slug: "servicios-varios", tono: "bg-[#ECE7DC] text-tinta" },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-borde">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/" aria-label="Las 3B, inicio">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1 text-[15px]">
            <Link href="/proveedores/registro" className="hidden px-3 py-2.5 sm:block">Soy proveedor</Link>
            <Link href="/ingresar" className="rounded-xl border-2 border-tinta px-4 py-2 font-semibold">Ingresar</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-14 pt-10">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-borde bg-white px-3 py-1.5 text-sm font-semibold text-tinta-2">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-2 rounded-full bg-verde" />
              <span className="size-2 rounded-full bg-ladrillo" />
              <span className="size-2 rounded-full bg-amarillo" />
            </span>
            {MARCA.lema}
          </p>
          <h1 className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
            Encuentra quién te ayude, <span className="text-verde">cerca de ti.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-tinta-2">
            Plomeros, profesores, acarreos y oficios de confianza en tu localidad. Escríbeles directo por WhatsApp, sin comisiones.
          </p>

          <form action="/buscar" className="flex max-w-3xl flex-wrap items-end gap-3 rounded-[22px] bg-white p-4 shadow-[0_8px_30px_rgba(27,38,35,0.08)]">
            <div className="flex min-w-0 flex-[2_1_220px] flex-col gap-1.5">
              <label htmlFor="q" className="text-sm font-semibold text-gris">Servicio o clase</label>
              <input id="q" name="q" type="search" placeholder="Ej: plomero, clases de inglés" className="h-13 rounded-campo border-[1.5px] border-borde-campo px-4 text-base" />
            </div>
            <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
              <label htmlFor="localidad" className="text-sm font-semibold text-gris">Localidad</label>
              <select id="localidad" name="localidad" className="h-13 rounded-campo border-[1.5px] border-borde-campo bg-white px-3 text-base">
                {LOCALIDADES_BOGOTA.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-13 rounded-campo bg-tinta px-7 font-semibold text-white">Buscar</button>
          </form>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col gap-5 px-5 pb-14">
          <h2 className="font-display text-3xl font-bold tracking-tight">Categorías</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIAS.map((c) => (
              <Link key={c.slug} href={`/buscar?categoria=${c.slug}`} className={`flex min-h-36 flex-col justify-end gap-1 rounded-[22px] p-5 ${c.tono}`}>
                <span className="text-lg font-bold">{c.nombre}</span>
                <span className="text-sm">{c.detalle}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-7 text-sm text-gris">
          <p className="max-w-xl leading-relaxed">
            Las 3B es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Datos personales</Link>
            <Link href="/reclamos">Presentar un reclamo</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
