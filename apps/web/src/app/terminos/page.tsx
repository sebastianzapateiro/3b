import { meta } from "@/lib/seo";
import { Faq } from "@/components/Faq";
import { FAQ_TERMINOS } from "@/lib/faqs";

export const metadata = meta({ titulo: "Términos de uso", descripcion: "Condiciones para usar LasTresB: qué es el portal, qué no es y cómo se acuerdan los servicios con cada proveedor.", ruta: "/terminos" });

/**
 * Páginas legales — texto vigente (versión 1.0, redacción del modelo; revisión pendiente del Drive).
 * Contiene la exoneración de responsabilidad: LasTresB es plataforma de tráfico que verifica datos
 * básicos; la responsabilidad y conversación contractual son entre proveedor y cliente.
 */
export default function Terminos() {
  return (
    <>
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Términos de uso</h1>
      <p className="mt-4 text-sm text-gris">Versión 1.1 — Vigencia: 27 de octubre de 2026. Última actualización: 30 de octubre de 2026.</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">1. Objeto</h2>
        <p className="leading-relaxed">
          LasTresB es un directorio y plataforma de contacto gratuito. El comprador describe un servicio u oficio y
          contacta al proveedor directamente por WhatsApp; el servicio, el precio, la fecha y las garantías se
          acuerdan entre el proveedor y el comprador.
        </p>

        <h2 className="font-display text-2xl font-bold">2. Exención de responsabilidad</h2>
        <p className="leading-relaxed">
          LasTresB es una plataforma de tráfico que verifica datos básicos para la inscripción (mayoría de edad,
          consentimientos). Queda <strong>exonerada de responsabilidad</strong> por la prestación del servicio, por
          defectos, riesgos, garantías o incumplimientos ocurridos tras el contacto.
        </p>
        <p className="leading-relaxed">
          La responsabilidad civil y la conversación contractual (precio, fecha, garantías) son entre el proveedor y
          el cliente. LasTresB no interviene en pagos, no cobra comisiones, no es intermediario de pagos, empleador ni
          garante del servicio.
        </p>

        <h2 className="font-display text-2xl font-bold">3. Elegibilidad</h2>
        <p className="leading-relaxed">El servicio está dirigido a personas mayores de 18 años con capacidad legal para contratar.</p>
        <p className="leading-relaxed">Al registrarse en LasTresB se aceptan estos términos.</p>

        <h2 className="font-display text-2xl font-bold">4. Naturaleza de la plataforma</h2>
        <p className="leading-relaxed">
          LasTresB es una plataforma digital gratuita que permite a las personas encontrar proveedores de servicios del
          hogar y contactarlos directamente. LasTresB no es empleador, contratista, agencia de empleo ni intermediario
          laboral de los proveedores, y no presta los servicios publicados. Entre el proveedor y el cliente existe una
          relación independiente que ellos acuerdan directamente, incluyendo el alcance del servicio, el precio, el
          tiempo, la forma de pago y las condiciones del trabajo. LasTresB no define, supervisa ni garantiza horarios,
          jornadas, remuneración ni condiciones laborales, y no responde por las obligaciones que surjan entre
          proveedor y cliente. El uso de la plataforma no genera vínculo laboral, de subordinación ni de representación
          con LasTresB. Los proveedores son responsables de sus propias obligaciones legales, tributarias y de
          seguridad social. LasTresB puede suspender perfiles que ofrezcan servicios no permitidos o incumplan estos
          términos.
        </p>
      </section>
    </main>
    <Faq preguntas={FAQ_TERMINOS} />
    </>
  );
}
