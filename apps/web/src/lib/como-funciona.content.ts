/**
 * Contenido de «¿Cómo funciona LasTresB?» para la home y /como-funciona (P2 búsqueda, P3 perfil, P4 contacto, P5 reseñas; clientes y proveedores).
 * Solo texto y datos: el diseño vive en components/ComoFuncionaHome.tsx y ComoFuncionaPagina.tsx.
 *
 * Trazabilidad (verificada en docs/02-casos-de-uso.md, docs/03-arquitectura.md y el código):
 *  - Cliente 1 y 2 → CU-01 Búsqueda (P2). Cliente 3 → portafolio público (P7; el catálogo de CU no lo numera aquí).
 *  - Cliente 4 → CU-05 (clic en `contactos` y apertura de wa.me, P4). Cliente 5 → reseña por contacto previo (P5, regla 4 de AGENTS.md).
 *  - Proveedor 1 a 3 → alta del proveedor, CU-30 / CU-32 (docs/02, docs/09). Proveedor 4 → página pública del proveedor (P7).
 *  - No se pudo verificar en los docs del repo ningún CU específico para «Cómo funciona»: no se le atribuye ninguno.
 */
import { MARCA } from "@las3b/shared";
import { SITIO_URL } from "@/lib/seo";

export type RolComo = "cliente" | "proveedor";
export type IconoPaso = "lupa" | "tarjeta" | "fotos" | "chat" | "estrella" | "usuario" | "perfil" | "escudo" | "enlace";
export type ColorPanel = "verde" | "ladrillo" | "amarillo" | "tinta";

export type PasoComo = {
  icono: IconoPaso;
  color: ColorPanel;
  titulo: string;
  /** Versión breve, para el recorrido de la home. */
  corto: string;
  /** Versión completa, para /como-funciona. */
  texto: string;
  /** Foto del paso en public/como-funciona/ (ej. "/como-funciona/cliente-1.webp"). Sin ella se usa el degradado con icono. */
  imagen?: string;
  /** Descripción de la foto (alt). */
  alt: string;
};

export type PestanaComo = {
  id: RolComo;
  titulo: string;
  subtexto: string;
  pasos: PasoComo[];
  boton: { texto: string; href: string; tono: "tinta" | "amarillo" };
};

/** Dirección pública para mostrar (sin «https://»), tomada de la configuración del sitio. */
const dominio = (() => {
  try {
    return new URL(SITIO_URL).host;
  } catch {
    return MARCA.dominio;
  }
})();

export const COMO_FUNCIONA = {
  titulo: "¿Cómo funciona LasTresB?",
  subtitulo: "Encuentras a quien te ayude en tu localidad y le escribes directo por WhatsApp. Es gratis y no cobramos comisiones.",
  home: {
    titulo: "Todo buen trabajo empieza con el proveedor adecuado",
    subtitulo: "Búscalo, compáralo y escríbele directo por WhatsApp. Sin comisiones.",
    enlace: "Ver cómo funciona →",
    boton: "Ver cómo funciona completo →",
  },
  pestanas: [
    {
      id: "cliente",
      titulo: "Soy cliente",
      subtexto: "Busco un servicio",
      pasos: [
        // TODO foto cliente-1.webp: una persona buscando un servicio en el celular.
        { icono: "lupa", color: "verde", titulo: "Busca lo que necesitas", corto: "En el inicio escribe el servicio, como «plomero» o «clases de inglés», y elige tu localidad.", texto: "En el inicio escribe el servicio, como «plomero» o «clases de inglés», y elige tu localidad. También puedes entrar por categorías o por localidad.", alt: "Persona buscando un servicio en el celular" },
        // TODO foto cliente-2.webp: pantalla con perfiles de proveedores y estrellas.
        { icono: "tarjeta", color: "ladrillo", titulo: "Compara proveedores", corto: "Mira la calificación, las reseñas de clientes reales, las insignias de verificación y en qué localidades atiende cada uno.", texto: "Mira la calificación, las reseñas de clientes reales, las insignias de verificación y en qué localidades atiende cada uno.", alt: "Pantalla con perfiles de proveedores y calificaciones" },
        // TODO foto cliente-3.webp: galería de trabajos terminados.
        { icono: "fotos", color: "amarillo", titulo: "Revisa su portafolio", corto: "Entra a su página para ver fotos de trabajos, lo que ofrece y lo que dicen sus clientes antes de decidir.", texto: "Entra a su página para ver fotos de trabajos, lo que ofrece y lo que dicen sus clientes antes de decidir.", alt: "Galería de trabajos terminados de un proveedor" },
        // TODO foto cliente-4.webp: celular con una conversación de WhatsApp.
        { icono: "chat", color: "tinta", titulo: "Escríbele por WhatsApp", corto: "Pulsa el botón y cuéntale qué necesitas.", texto: "Pulsa el botón y cuéntale qué necesitas. Acuerden precio, fecha y garantía directamente, sin intermediarios ni comisiones. Deja lo pactado por escrito en el chat.", alt: "Celular con una conversación de WhatsApp con un proveedor" },
        // TODO foto cliente-5.webp: persona dejando una reseña.
        { icono: "estrella", color: "verde", titulo: "Cuenta cómo te fue", corto: "Comparte tu experiencia y ayuda a otros clientes a elegir.", texto: "Si contactaste al proveedor desde LasTresB, podrás dejar una reseña sobre tu experiencia. Para publicarla, deberás tener una cuenta.", alt: "Persona dejando una reseña de un servicio" },
      ],
      boton: { texto: "Buscar un servicio", href: "/proveedores", tono: "tinta" },
    },
    {
      id: "proveedor",
      titulo: "Soy proveedor",
      subtexto: "Ofrezco un servicio",
      pasos: [
        // TODO foto proveedor-1.webp: persona registrándose en el celular.
        { icono: "usuario", color: "verde", titulo: "Crea tu cuenta gratis", corto: "Regístrate con tu nombre, correo, WhatsApp y contraseña.", texto: "Regístrate como proveedor con tus datos de contacto y crea tu cuenta para comenzar.", alt: "Persona registrándose como proveedor en el celular" },
        // TODO foto proveedor-2.webp: perfil con fotos de trabajos.
        { icono: "perfil", color: "ladrillo", titulo: "Completa tu perfil", corto: "Cuenta qué servicios ofreces, en qué localidades trabajas y sube fotos de tus trabajos.", texto: "Cuenta qué servicios ofreces, en qué localidades trabajas y sube fotos de tus trabajos.", alt: "Perfil de proveedor con fotos de sus trabajos" },
        // TODO foto proveedor-3.webp: documento y WhatsApp en revisión.
        { icono: "escudo", color: "amarillo", titulo: "Revisamos tu información", corto: "Validamos los datos de tu perfil antes de publicarlo.", texto: "Revisamos la información de tu perfil y los requisitos correspondientes a tu servicio antes de publicarlo.", alt: "Documento y datos de contacto en revisión" },
        // TODO foto proveedor-4.webp: persona compartiendo su enlace con clientes y en redes.
        { icono: "enlace", color: "tinta", titulo: "Comparte tu página", corto: "Tendrás un enlace propio para compartir en tus redes y con tus clientes.", texto: `Tendrás una dirección propia (${dominio}/tunombre). Compártela en tus redes y con tus clientes para que conozcan tus servicios y te contacten directamente por WhatsApp.`, alt: "Proveedor compartiendo el enlace de su página" },
      ],
      // Un solo ingreso en el sitio: desde /ingreso sigue el alta del proveedor.
      boton: { texto: "Regístrame como proveedor", href: "/ingreso", tono: "amarillo" },
    },
  ] satisfies PestanaComo[],
};
