import { Faq } from "@/components/Faq";
import { FAQ_COOKIES } from "@/lib/faqs";
import { meta } from "@/lib/seo";

export const metadata = meta({ titulo: "Política de cookies", descripcion: "Qué cookies usa LasTresB, para qué sirven y cómo aceptarlas o rechazarlas.", ruta: "/cookies" });

/**
 * Política de cookies (Ley 1581 de 2012). Describe lo que el sitio usa hoy.
 * Documento sujeto a revisión legal antes de publicarse como versión definitiva.
 */
export default function Cookies() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-extrabold">Política de cookies</h1>
        <p className="mt-4 text-sm text-gris">Última actualización: 28 de octubre de 2026.</p>

        <section className="mt-8 flex flex-col gap-3">
          <h2 className="font-display text-2xl font-bold">1. Qué son</h2>
          <p className="leading-relaxed">Las cookies y el almacenamiento local son archivos pequeños que el navegador guarda para recordar cosas entre visitas.</p>

          <h2 className="font-display text-2xl font-bold">2. Las que usamos</h2>
          <div className="overflow-x-auto rounded-2xl border border-borde-suave bg-white">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead><tr className="bg-crema text-gris"><th className="p-3 font-semibold">Nombre</th><th className="p-3 font-semibold">Para qué</th><th className="p-3 font-semibold">Tipo</th><th className="p-3 font-semibold">Duración</th></tr></thead>
              <tbody>
                <tr className="border-t border-borde-suave"><td className="p-3 font-mono text-xs">better-auth.*</td><td className="p-3">Mantener tu sesión iniciada</td><td className="p-3">Necesaria</td><td className="p-3">Hasta 30 días (8 h en el backoffice)</td></tr>
                <tr className="border-t border-borde-suave"><td className="p-3 font-mono text-xs">anonimo_id</td><td className="p-3">Registrar tu contacto con un proveedor para poder calificarlo después</td><td className="p-3">Necesaria</td><td className="p-3">30 días</td></tr>
                <tr className="border-t border-borde-suave"><td className="p-3 font-mono text-xs">cookies_analitica_v1</td><td className="p-3">Recordar tu decisión sobre estas cookies (almacenamiento local)</td><td className="p-3">Necesaria</td><td className="p-3">Hasta que la cambies</td></tr>
                <tr className="border-t border-borde-suave"><td className="p-3 font-mono text-xs">_ga, _ga_*</td><td className="p-3">Google Analytics 4: medir visitas de forma agregada</td><td className="p-3">Analítica (opcional)</td><td className="p-3">Hasta 2 años</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl font-bold">3. Tu decisión</h2>
          <p className="leading-relaxed">Las cookies necesarias no requieren tu permiso porque sin ellas el sitio no funciona. Las de analítica solo se cargan si las aceptas en el aviso. Puedes cambiar tu decisión en cualquier momento con «Configurar cookies» en el pie de página, o borrar las cookies desde tu navegador.</p>

          <h2 className="font-display text-2xl font-bold">4. Terceros</h2>
          <p className="leading-relaxed">Google Analytics lo opera Google LLC, con servidores que pueden estar fuera de Colombia. Solo se activa con tu permiso. Más información sobre el tratamiento de tus datos en la <a className="font-semibold text-verde" href="/privacidad">política de datos personales</a>.</p>
        </section>
      </main>
      <Faq preguntas={FAQ_COOKIES} />
    </>
  );
}