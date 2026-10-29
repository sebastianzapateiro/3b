import { JsonLd } from "@/components/JsonLd";
import type { Pregunta } from "@/lib/faqs";

/** Preguntas frecuentes al final de cada sección, con datos estructurados FAQPage. */
export function Faq({ preguntas, titulo = "Preguntas frecuentes", lateral = false }: { preguntas: Pregunta[]; titulo?: string; lateral?: boolean }) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((p) => ({
      "@type": "Question",
      name: p.pregunta,
      acceptedAnswer: { "@type": "Answer", text: p.respuesta },
    })),
  };

  return (
    <section aria-labelledby="faq" className={lateral ? "mx-auto grid w-full max-w-[1200px] gap-4 px-5 pb-14 pt-2 sm:px-6 lg:grid-cols-[200px_1fr] lg:gap-10" : "mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pb-14 pt-2 sm:px-6"}>
      <JsonLd datos={datos} />
      {lateral && <span aria-hidden="true" className="hidden font-display text-lg font-bold lg:block">FAQ</span>}
      <div className="flex flex-col gap-3">
      <h2 id="faq" className="scroll-mt-24 font-display text-[22px] font-bold sm:text-[28px]">{titulo}</h2>
      <div className="flex flex-col gap-2.5">
        {preguntas.map((p) => (
          <details key={p.pregunta} className="group rounded-2xl border border-borde-suave bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold text-tinta [&::-webkit-details-marker]:hidden">
              {p.pregunta}
              <svg className="size-5 flex-none transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="px-4 pb-4 text-[15px] leading-relaxed text-tinta-2">{p.respuesta}</p>
          </details>
        ))}
      </div>
      </div>
    </section>
  );
}
