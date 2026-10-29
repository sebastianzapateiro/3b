import { meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_RECLAMOS } from "@/lib/faqs";

export const metadata = meta({ titulo: "Reclamos", descripcion: "Cómo presentar un reclamo sobre un proveedor o un perfil publicado en Las 3B.", ruta: "/reclamos" });

/**
 * Páginas legales — texto vigente (versión 1.0, redacción del modelo; revisión pendiente del Drive).
 * Procedimiento de reclamos (CU-10, Ley 1480 art. 53) con exoneración recíproca de responsabilidad.
 */
export default function Reclamos() {
  return (
    <>
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Política de reclamos</h1>
      <p className="mt-4 text-sm text-gris">Versión 1.0 — Vigencia: 27 de octubre de 2026.</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">1. Presentación</h2>
        <p className="leading-relaxed">
          El reclamante puede presentar un reclamo de consumo ante Las 3B o directamente contra el proveedor,
          cuando corresponda, acreditando código de servicio o evidencia.
        </p>

        <h2 className="font-display text-2xl font-bold">2. Mecanismo</h2>
        <p className="leading-relaxed">
          Las 3B facilita el contacto y la comunicación entre usuario y proveedor. Las 3B no interviene en la
          responsabilidad civil derivada de la prestación del servicio.
        </p>

        <h2 className="font-display text-2xl font-bold">3. Plazo</h2>
        <p className="leading-relaxed">Las 3B entrega los datos del proveedor al reclamante en 15 días hábiles.</p>
      </section>
    </main>
    <Faq preguntas={FAQ_RECLAMOS} />
    </>
  );
}
