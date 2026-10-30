import type { Metadata } from "next";
import { ComoFunciona } from "@/components/ComoFunciona";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { COMO_FUNCIONA } from "@/lib/como-funciona.content";
import { FAQ_COMO_FUNCIONA } from "@/lib/faqs";
import { absoluta, jsonLdMigas, meta } from "@/lib/seo";

export const metadata: Metadata = meta({ titulo: "¿Cómo funciona LasTresB? Paso a paso", descripcion: "Busca un servicio en tu localidad de Bogotá, compara reseñas y escribe directo por WhatsApp. Gratis y sin comisiones. Así de fácil.", ruta: "/como-funciona" });

/** Se puede enlazar a una pestaña con /como-funciona?como=cliente|proveedor. */
export default function PaginaComoFunciona() {
  const cliente = COMO_FUNCIONA.pestanas[0]!;
  const proveedor = COMO_FUNCIONA.pestanas[1]!;
  const howTo = (nombre: string, pasos: typeof cliente.pasos, ancla: string) => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: nombre,
    inLanguage: "es-CO",
    step: pasos.map((p, i) => ({ "@type": "HowToStep", position: i + 1, name: p.titulo, text: p.texto, url: `${absoluta("/como-funciona")}#${ancla}-${i + 1}` })),
  });

  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "¿Cómo funciona?", ruta: "/como-funciona" }])} />
      <JsonLd datos={howTo("Cómo contratar un servicio en LasTresB", cliente.pasos, "paso")} />
      <JsonLd datos={howTo("Cómo ofrecer tus servicios en LasTresB", proveedor.pasos, "proveedor-paso")} />
      <main className="mx-auto flex max-w-[1000px] flex-col gap-6 px-5 pb-14 pt-4 sm:gap-8 sm:px-6 sm:pt-10">
        <ComoFunciona />
      </main>
      <Faq preguntas={FAQ_COMO_FUNCIONA} />
    </>
  );
}
