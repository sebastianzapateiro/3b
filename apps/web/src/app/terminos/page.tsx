import { meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_TERMINOS } from "@/lib/faqs";

export const metadata = meta({ titulo: "Términos de uso", descripcion: "Condiciones para usar Las 3B: qué es el portal, qué no es y cómo se acuerdan los servicios con cada proveedor.", ruta: "/terminos" });

/**
 * Páginas legales — texto vigente (versión 1.0, redacción del modelo; revisión pendiente del Drive).
 * Contiene la exoneración de responsabilidad: Las 3B es plataforma de tráfico que verifica datos
 * básicos; la responsabilidad y conversación contractual son entre proveedor y cliente.
 */
export default function Terminos() {
  return (
    <>
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Términos de uso</h1>
      <p className="mt-4 text-sm text-gris">Versión 1.0 — Vigencia: 27 de octubre de 2026.</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">1. Objeto</h2>
        <p className="leading-relaxed">
          Las 3B es un directorio y plataforma de contacto gratuito. El comprador describe un servicio u oficio y
          contacta al proveedor directamente por WhatsApp; el servicio, el precio, la fecha y las garantías se
          acuerdan entre el proveedor y el comprador.
        </p>

        <h2 className="font-display text-2xl font-bold">2. Exención de responsabilidad</h2>
        <p className="leading-relaxed">
          Las 3B es una plataforma de tráfico que verifica datos básicos para la inscripción (mayoría de edad,
          consentimientos). Queda <strong>exonerada de responsabilidad</strong> por la prestación del servicio, por
          defectos, riesgos, garantías o incumplimientos ocurridos tras el contacto.
        </p>
        <p className="leading-relaxed">
          La responsabilidad civil y la conversación contractual (precio, fecha, garantías) son entre el proveedor y
          el cliente. Las 3B no interviene en pagos, no cobra comisiones, no es intermediario de pagos, empleador ni
          garante del servicio.
        </p>

        <h2 className="font-display text-2xl font-bold">3. Elegibilidad</h2>
        <p className="leading-relaxed">El servicio está dirigido a personas mayores de 18 años con capacidad legal para contratar.</p>
        <p className="leading-relaxed">Al registrarse en Las 3B se aceptan estos términos.</p>
      </section>
    </main>
    <Faq preguntas={FAQ_TERMINOS} />
    </>
  );
}
