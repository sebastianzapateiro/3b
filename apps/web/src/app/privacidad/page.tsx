import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de datos · Las 3B" };

/**
 * Páginas legales — texto vigente (versión 1.0, redacción del modelo; revisión pendiente del Drive).
 * Tratamiento de datos con consentimientos conforme a la Ley 1581 de 2012.
 */
export default function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Política de tratamiento de datos</h1>
      <p className="mt-4 text-sm text-gris">Versión 1.0 — Vigencia: 27 de octubre de 2026.</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">1. Datos que tratamos</h2>
        <p className="leading-relaxed">
          Datos de la cuenta (nombre, correo, datos de verificación y consentimientos) y datos privados de
          proveedores (documento cifrado, dirección de notificaciones, RUT, fecha de nacimiento) que no salen del
          portafolio público.
        </p>

        <h2 className="font-display text-2xl font-bold">2. Consentimientos</h2>
        <p className="leading-relaxed">
          Al registrarse se requiere casilla no premarcada de mayoría de edad y aceptación de los términos y el
          tratamiento de datos; se guarda versión, fecha e IP.
        </p>

        <h2 className="font-display text-2xl font-bold">3. Conservación y derechos</h2>
        <p className="leading-relaxed">
          Consultas, rectificaciones, supresiones o exportaciones conforme a la Ley 1581 de 2012.
        </p>

        <h2 className="font-display text-2xl font-bold">4. Reseñas</h2>
        <p className="leading-relaxed">
          Una reseña por contacto y solo con un clic previo; se conservan bloqueadas 5 años tras eliminar la cuenta.
        </p>
      </section>
    </main>
  );
}
