import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { MARCA } from "@las3b/shared";
import { JsonLd } from "@/components/JsonLd";
import { RECOMENDADOS_DEMO } from "@/lib/demo";
import { obtenerPortafolio } from "@/lib/portafolio";
import { jsonLdMigas, jsonLdProveedor } from "@/lib/seo";

/**
 * P7 · Portafolio público del proveedor en lastresb.com.co/<slug> (RF-37 a RF-43, CU-04).
 * Pendiente: diseño completo según docs/mockups/Perfil_web y Perfil_movil (servicios, galería, reseñas).
 */
type Props = { params: Promise<{ slug: string }> };

const resolver = cache(async (slug: string) => {
  const demo = RECOMENDADOS_DEMO.find((p) => p.slug === slug);
  if (demo) return { tipo: "demo" as const, nombre: demo.nombre };
  return obtenerPortafolio(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolver(slug);

  if (r.tipo === "publicado") {
    const p = r.proveedor;
    const titulo = `${p.nombre}: ${p.servicios.slice(0, 2).join(" y ") || "servicios"} en ${p.localidades.slice(0, 2).join(", ") || "Bogotá"}`;
    const descripcion =
      p.presentacion?.slice(0, 155) ??
      `${p.nombre} ofrece ${p.servicios.join(", ").toLowerCase()} en ${p.localidades.join(", ")}, Bogotá. Mira sus reseñas y escríbele por WhatsApp.`;
    return {
      title: titulo,
      description: descripcion,
      alternates: { canonical: `/${p.slug}` },
      openGraph: { type: "profile", title: titulo, description: descripcion, url: `/${p.slug}`, siteName: MARCA.nombre, locale: "es_CO" },
    };
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
        <p className="mt-3 text-lg text-tinta-2">Este proveedor no está disponible temporalmente.</p>
      </main>
    );
  }

  if (r.tipo === "demo") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="font-mono text-sm text-gris">{MARCA.dominio}/{slug}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{r.nombre}</h1>
        <p className="mt-3 text-lg text-tinta-2">Perfil de ejemplo. El portafolio completo está en construcción.</p>
      </main>
    );
  }

  const p = r.proveedor;
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd
        datos={jsonLdProveedor({
          slug: p.slug,
          nombre: p.nombre,
          descripcion: p.presentacion,
          servicios: p.servicios,
          localidades: p.localidades,
          calificacion: { promedio: p.promedio, total: p.totalResenas },
        })}
      />
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: p.nombre, ruta: `/${p.slug}` }])} />
      <p className="font-mono text-sm text-gris">{MARCA.dominio}/{p.slug}</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{p.nombre}</h1>
      <p className="mt-2 text-tinta-2">
        {p.servicios.join(" · ")} — {p.localidades.join(", ")}
      </p>
      {p.presentacion && <p className="mt-4 text-lg leading-relaxed">{p.presentacion}</p>}
    </main>
  );
}
