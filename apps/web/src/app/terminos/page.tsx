import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de uso · Las 3B" };

/**
 * Páginas legales (pendiente: textos del Drive en carpeta "Textos legales").
 * Contenido inicial con la exoneración de responsabilidad: Las 3B es plataforma
 * de contacto y no responde por la prestación del servicio; la responsabilidad
 * civil y la conversación contractual quedan entre proveedor y cliente.
 */
export default function Terminos() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Términos de uso</h1>
      <p className="mt-4 text-sm text-gris">Vigente desde 27 de octubre de 2026 (versión registrada en la plataforma).</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">Uso de la plataforma</h2>
        <p className="leading-relaxed">
          Las 3B es un directorio y plataforma de contacto gratuita. El comprador busca un servicio u oficio y
          contacta al proveedor directo por WhatsApp. La compra, el precio, la fecha y la garantía se
          acuerdan directamente entre proveedor y cliente; Las 3B no interviene en pagos, no cobra comisiones
          y no es intermediario.
        </p>
        <h2 className="font-display text-2xl font-bold">Exención de responsabilidad</h2>
        <p className="leading-relaxed">
          Las 3B actúa solo como plataforma de tráfico que verifica datos básicos para la inscripción
          (mayoría de edad, consentimientos). <strong>Queda exonerada de responsabilidad por la prestación
          del servicio, por defectos, riesgos, garantías o incumplimientos</strong> ocurridos después del
          contacto. La responsabilidad civil y la conversación contractual son entre el proveedor y el cliente.
        </p>
      </section>
    </main>
  );
}
