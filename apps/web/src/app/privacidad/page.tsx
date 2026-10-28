import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de datos · Las 3B" };

/**
 * Páginas legales (pendiente: textos del Drive en carpeta "Textos legales").
 * Contenido inicial con tratamiento de datos y consentimientos (RF-19, Ley 1581).
 */
export default function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">Política de tratamiento de datos</h1>
      <p className="mt-4 text-sm text-gris">Vigente desde 27 de octubre de 2026 (versión registrada en la plataforma).</p>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">Datos que tratamos</h2>
        <p className="leading-relaxed">
          En tu cuenta guardamos nombre, correo, datos de verificación y consentimientos. En los proveedores
          guardamos datos privados (documento cifrado, dirección de notificaciones, RUT, fecha de nacimiento)
          que no salen del portafolio público. Las reseñas quedan anónimas al eliminar una cuenta (5 años de
          conservación bloqueada).
        </p>
        <h2 className="font-display text-2xl font-bold">Consentimientos</h2>
        <p className="leading-relaxed">
          Al registrar tu cuenta declaras ser mayor de edad y aceptas los términos de uso y el tratamiento de
          datos con casilla no premarcada; guardamos versión, fecha e IP del consentimiento.
        </p>
        <h2 className="font-display text-2xl font-bold">Solicitudes</h2>
        <p className="leading-relaxed">
          Puedes ejercer consultas, rectificaciones, supresiones o exportaciones ante Las 3B o contra el
          responsable del tratamiento (procedimiento de la Ley 1581).
        </p>
      </section>
    </main>
  );
}
