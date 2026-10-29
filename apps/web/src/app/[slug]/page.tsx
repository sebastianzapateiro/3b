import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { MARCA } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { FAQ_PORTAFOLIO } from "@/lib/faqs";
import { perfilDemo, RECOMENDADOS_DEMO } from "@/lib/demo";
import { PerfilProveedor } from "@/components/PerfilProveedor";
import { obtenerPortafolioCompleto } from "@/lib/portafolio-completo";
import { jsonLdMigas, jsonLdProveedor, meta } from "@/lib/seo";

/**
 * P7 · Portafolio público del proveedor en lastresb.com.co/<slug> (RF-37 a RF-43, CU-04).
 * Diseño completo según docs/mockups/Perfil_web y Perfil_movil.
 */
type Props = { params: Promise<{ slug: string }> };

const resolver = cache(async (slug: string) => {
  const demo = RECOMENDADOS_DEMO.find((p) => p.slug === slug);
  if (demo) return { tipo: "demo" as const, nombre: demo.nombre };
  return obtenerPortafolioCompleto(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolver(slug);

  if (r.tipo === "publicado") {
    const p = r.proveedor;
    const oficios = p.categorias.slice(0, 2).join(" y ") || "servicios";
    const zona = p.localidades.slice(0, 2).join(" y ") || "Bogotá";
    const titulo = `${p.nombre}: ${oficios} en ${zona}, Bogotá`;
    const descripcion =
      p.presentacion?.slice(0, 155) ??
      `${p.nombre} ofrece ${oficios.toLowerCase()} en ${zona}, Bogotá. Mira sus reseñas y escríbele por WhatsApp.`;
    return meta({ titulo, descripcion, ruta: `/${p.slug}`, tipo: "profile" });
  }
  if (r.tipo === "demo" || r.tipo === "no_disponible") {
    return { title: r.nombre, robots: { index: false, follow: true } };
  }
  return {};
}

export default async function PortafolioProveedor({ params }: Props) {
  const { slug } = await params;
  const r = await resolver(slug);

  if (r.tipo === "redirigir") permanentRedirect(`/${r.slug}`);
  if (r.tipo === "no_existe") notFound();

  if (r.tipo === "no_disponible") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-extrabold">{r.nombre}</h1>
        <p className="mt-3 text-lg text-tinta-2">
          Este proveedor no está disponible temporalmente.
        </p>
      </main>
    );
  }

  if (r.tipo === "demo") {
    return (
      <>
        <PerfilProveedor proveedor={perfilDemo(slug)!} />
        <Faq preguntas={FAQ_PORTAFOLIO} />
      </>
    );
  }

  const p = r.proveedor;
  return (
    <>
      <JsonLd
        datos={jsonLdProveedor({
          slug: p.slug,
          nombre: p.nombre,
          descripcion: p.presentacion,
          servicios: p.categorias,
          localidades: p.localidades,
          calificacion: { promedio: p.promedio, total: p.totalResenas },
          resenas: p.resenas.map((r) => ({ autor: r.nombreCliente, estrellas: r.estrellas, texto: r.comentario, fecha: r.creadoEn })),
          ofertas: p.servicios.map((s) => ({ nombre: s.nombre, precioDesde: s.precioDesde })),
        })}
      />
      <JsonLd
        datos={jsonLdMigas([
          { nombre: "Inicio", ruta: "/" },
          { nombre: p.nombre, ruta: `/${p.slug}` },
        ])}
      />
      <PerfilProveedor proveedor={p} />
      <Faq preguntas={FAQ_PORTAFOLIO} />
    </>
  );
}