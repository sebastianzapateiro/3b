import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de reclamos · Las 3B" };

/**
 * Páginas legales (pendiente: textos del Drive en carpeta "Textos legales").
 * Contenido inicial con el procedimiento de reclamos (CU-10, Ley 1480 art. 53).
 */
export default function Reclamos() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Política de reclamos</h1>
      <p className="mt-4 text-sm text-gris">Vigente desde 27 de octubre de 2026 (versión registrada en la plataforma).</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">Presentar un reclamo</h2>
        <p className="leading-relaxed">
          Puedes presentar un reclamo de consumo ante Las 3B o directamente contra el proveedor, cuando aplique.
          El reclamante debe acreditar con código de servicio o evidencia; Las 3B entrega los datos del proveedor
          en 15 días hábiles.
        </p>
        <h2 className="font-display text-2xl font-bold">Mecanismo</h2>
        <p className="leading-relaxed">
          Las 3B facilita la denuncia entre usuario y proveedor (contacto y contexto). Las 3B no interviene en la
          responsabilidad civil derivada de la prestación del servicio.
        </p>
      </section>
    </main>
  );
}
