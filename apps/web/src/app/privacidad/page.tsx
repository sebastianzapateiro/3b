import { TRATAMIENTO_DATOS } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { TextoLegal } from "@/components/TextoLegal";
import { FAQ_PRIVACIDAD } from "@/lib/faqs";
import { meta } from "@/lib/seo";

export const metadata = meta({ titulo: "Tratamiento de datos personales", descripcion: "Cómo Las 3B trata tus datos personales, con qué finalidad y cómo ejercer tus derechos (Ley 1581 de 2012).", ruta: "/privacidad" });

/** Política de tratamiento de datos (Ley 1581 de 2012). Fuente: packages/shared/src/politicas.ts. */
export default function Privacidad() {
  return (
    <>
      <TextoLegal texto={TRATAMIENTO_DATOS} />
      <Faq preguntas={FAQ_PRIVACIDAD} />
    </>
  );
}