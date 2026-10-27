/** Inserta datos estructurados schema.org (fragmentos enriquecidos en Google). */
export function JsonLd({ datos }: { datos: object }) {
  return (
    <script
      type="application/ld+json"
      // `<` escapado para que ningún texto de usuario cierre la etiqueta.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
