import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIAS, LOCALIDADES_BOGOTA } from "@las3b/shared";
import { IconoCategoria, TONO_CATEGORIA } from "@/components/CategoriaVisual";
import { JsonLd } from "@/components/JsonLd";
import { conteosPorOficioYLocalidad, minProveedoresSeo } from "@/lib/publicacion";
import { jsonLdLista, jsonLdMigas, meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { faqLocalidad } from "@/lib/faqs";

/** Servicios por localidad (P2, SEO local). Solo Bogotá D.C.; los enlaces llevan a la búsqueda ya filtrada. */
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALIDADES_BOGOTA.map((l) => ({ slug: l.slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const localidad = LOCALIDADES_BOGOTA.find((l) => l.slug === slug);
  if (!localidad) return {};
  return meta({
    titulo: `Servicios y oficios en ${localidad.nombre}, Bogotá`,
    descripcion: `Plomería, electricidad, clases, acarreos y más en ${localidad.nombre}, Bogotá. Compara reseñas reales y escríbeles directo por WhatsApp, sin comisiones.`,
    ruta: `/localidades/${localidad.slug}`,
  });
}

export default async function Localidad({ params }: Props) {
  const { slug } = await params;
  const localidad = LOCALIDADES_BOGOTA.find((l) => l.slug === slug);
  if (!localidad) notFound();

  const ruta = `/localidades/${localidad.slug}`;
  // Solo se enlaza a la página SEO del oficio en esta localidad si ya cumple la regla de publicación; si no, a la búsqueda.
  const minimo = await minProveedoresSeo();
  const publicadas = new Set((await conteosPorOficioYLocalidad().catch(() => [])).filter((c) => c.localidad === localidad.slug && c.total >= minimo).map((c) => c.oficio));
  const buscar = (oficio: string) => (publicadas.has(oficio) ? `/servicios/${oficio}/${localidad.slug}` : `/buscar?categoria=${oficio}&localidad=${localidad.slug}`);
  const vecinas = LOCALIDADES_BOGOTA.filter((l) => l.slug !== localidad.slug);

  return (
    <>
      <JsonLd
        datos={jsonLdMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Localidades", ruta: "/localidades" },
          { nombre: localidad.nombre, ruta },
        ])}
      />
      <JsonLd
        datos={jsonLdLista(
          `Servicios en ${localidad.nombre}, Bogotá`,
          CATEGORIAS.flatMap((c) => c.subcategorias).map((s) => ({ nombre: s.nombre, ruta: buscar(s.slug) })),
        )}
      />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-5 pb-14 pt-2 sm:gap-7 sm:px-6 sm:pt-8">
        <nav aria-label="Migas de pan" className="text-sm text-gris">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li><Link href="/" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Inicio</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/localidades" className="inline-flex min-h-11 items-center text-verde hover:text-verde-oscuro">Localidades</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-tinta">{localidad.nombre}</li>
          </ol>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">Servicios y oficios en {localidad.nombre}</h1>
          <p className="max-w-[620px] text-base leading-normal text-tinta-2 sm:text-lg">
            Elige el servicio que necesitas en {localidad.nombre}, Bogotá, y escríbele directo al proveedor por WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORIAS.map((c) => (
            <section key={c.slug} className={`flex min-w-0 flex-col gap-4 rounded-[22px] p-5 ${TONO_CATEGORIA[c.icono]}`}>
              <div className="flex items-center gap-3">
                <IconoCategoria icono={c.icono} className="size-8 flex-none" />
                <h2 className="font-display text-xl font-bold">{c.nombre}</h2>
              </div>
              <ul className="flex flex-wrap gap-2">
                {c.subcategorias.map((s) => (
                  <li key={s.slug}>
                    <Link href={buscar(s.slug)} className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium text-tinta">
                      {s.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <nav aria-label="Otras localidades" className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold">Otras localidades de Bogotá</h2>
          <ul className="flex flex-wrap gap-x-5">
            {vecinas.map((l) => (
              <li key={l.slug}>
                <Link href={`/localidades/${l.slug}`} className="inline-flex min-h-9 items-center text-[15px] text-verde hover:text-verde-oscuro">{l.nombre}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Faq preguntas={faqLocalidad(localidad.nombre)} />
    </>
  );
}
