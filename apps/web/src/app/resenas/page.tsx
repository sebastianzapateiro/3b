import { Faq } from "@/components/Faq";
import { FAQ_RESENAS } from "@/lib/faqs";
import { meta } from "@/lib/seo";

export const metadata = meta({ titulo: "Política de reseñas", descripcion: "Quién puede calificar en LasTresB, cómo se calculan las estrellas y qué reseñas se retiran.", ruta: "/resenas" });

/** Política de reseñas: describe las reglas que aplica el sistema (docs/02-casos-de-uso.md, CU-20 a CU-23). Sujeta a revisión legal. */
export default function PoliticaResenas() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-extrabold">Política de reseñas</h1>
        <p className="mt-4 text-sm text-gris">Última actualización: 28 de octubre de 2026.</p>

        <section className="mt-8 flex flex-col gap-3">
          <h2 className="font-display text-2xl font-bold">1. Quién puede calificar</h2>
          <p className="leading-relaxed">Solo quien escribió al proveedor por WhatsApp desde LasTresB, con una cuenta, y una vez por contacto. Los proveedores no pueden calificarse a sí mismos.</p>

          <h2 className="font-display text-2xl font-bold">2. Cómo se calcula</h2>
          <p className="leading-relaxed">Cada reseña promedia cuatro criterios de 1 a 5: puntualidad, calidad del trabajo, calidad-precio y cumplimiento. La calificación de un proveedor es el promedio de sus reseñas visibles.</p>

          <h2 className="font-display text-2xl font-bold">3. Qué se publica y qué se retira</h2>
          <p className="leading-relaxed">Las reseñas se publican de inmediato. Se ocultan las que contengan insultos o amenazas, datos personales de terceros, publicidad o spam, contenido sobre menores, o que se hayan obtenido a cambio de pagos o favores. Cualquier persona puede reportar una reseña y el equipo la revisa.</p>

          <h2 className="font-display text-2xl font-bold">4. Respuesta del proveedor</h2>
          <p className="leading-relaxed">El proveedor puede responder cada reseña una sola vez; la respuesta no se edita. No puede borrar ni modificar reseñas.</p>

          <h2 className="font-display text-2xl font-bold">5. Conservación</h2>
          <p className="leading-relaxed">Las reseñas se conservan, bloqueadas, durante 5 años después de que una persona elimine su cuenta.</p>

          <h2 className="font-display text-2xl font-bold">6. Responsabilidad</h2>
          <p className="leading-relaxed">Las reseñas expresan la opinión de quien las escribe. LasTresB es un portal de contacto y no garantiza el servicio ni la veracidad de cada opinión, pero actúa cuando se reporta contenido que incumple esta política.</p>
        </section>
      </main>
      <Faq preguntas={FAQ_RESENAS} />
    </>
  );
}