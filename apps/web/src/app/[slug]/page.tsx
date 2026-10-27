import type { Metadata } from "next";
import { MARCA } from "@las3b/shared";

/**
 * P7 · Portafolio público del proveedor en lastresb.com.co/<slug> (RF-37 a RF-43, CU-04).
 * Pendiente: cargar el proveedor aprobado por slug, redirigir 301 si está en slugs_historial,
 * mostrar "no disponible" si está pausado y 404 si está suspendido o rechazado.
 */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug, alternates: { canonical: `https://${MARCA.dominio}/${slug}` } };
}

export default async function PortafolioProveedor({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-mono text-sm text-gris">{MARCA.dominio}/{slug}</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Portafolio en construcción</h1>
    </main>
  );
}
