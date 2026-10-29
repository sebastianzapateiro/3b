import { TERMINOS_PROVEEDORES } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { TextoLegal } from "@/components/TextoLegal";
import { FAQ_TERMINOS_PROVEEDORES } from "@/lib/faqs";
import { meta } from "@/lib/seo";

export const metadata = meta({ titulo: "Términos de uso para proveedores", descripcion: "Condiciones para publicar tu portafolio en Las 3B: verificación, contenido, reseñas, precios y responsabilidades.", ruta: "/terminos-proveedores" });

/** Términos para proveedores. Fuente: packages/shared/src/politicas.ts (se aceptan en el alta de proveedor). */
export default function TerminosProveedores() {
  return (
    <>
      <TextoLegal texto={TERMINOS_PROVEEDORES} />
      <Faq preguntas={FAQ_TERMINOS_PROVEEDORES} />
    </>
  );
}