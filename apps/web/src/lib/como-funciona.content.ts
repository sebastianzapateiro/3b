/**
 * Contenido de la sección «¿Cómo funciona LasTresB?» de la home (P2/P3, para clientes y proveedores).
 * Solo texto y datos: el diseño vive en components/ComoFunciona.tsx.
 */
export type RolComo = "cliente" | "proveedor";
export type IconoPaso = "lupa" | "tarjeta" | "fotos" | "chat" | "estrella" | "usuario" | "perfil" | "escudo" | "qr";
export type ColorPanel = "verde" | "ladrillo" | "amarillo" | "tinta";

export type PasoComo = { icono: IconoPaso; panel: ColorPanel; titulo: string; texto: string };

export type PestanaComo = {
  id: RolComo;
  titulo: string;
  subtexto: string;
  acento: "verde" | "ladrillo";
  pasos: PasoComo[];
  boton: { texto: string; href: string; tono: "tinta" | "amarillo" };
};

export const COMO_FUNCIONA = {
  titulo: "¿Cómo funciona LasTresB?",
  subtitulo: "Encuentras a quien te ayude en tu localidad y le escribes directo por WhatsApp. Es gratis y no cobramos comisiones.",
  pestanas: [
    {
      id: "cliente",
      titulo: "Soy cliente",
      subtexto: "Busco un servicio",
      acento: "verde",
      pasos: [
        { icono: "lupa", panel: "verde", titulo: "Busca lo que necesitas", texto: "En el inicio escribe el servicio, como «plomero» o «clases de inglés», y elige tu localidad. También puedes entrar por categorías o por localidad." },
        { icono: "tarjeta", panel: "ladrillo", titulo: "Compara proveedores", texto: "Mira la calificación, las reseñas de clientes reales, las insignias de verificación y en qué localidades atiende cada uno." },
        { icono: "fotos", panel: "amarillo", titulo: "Revisa su portafolio", texto: "Entra a su página para ver fotos de trabajos, lo que ofrece y lo que dicen sus clientes antes de decidir." },
        { icono: "chat", panel: "tinta", titulo: "Escríbele por WhatsApp", texto: "Pulsa el botón y cuéntale qué necesitas. Acuerden precio, fecha y garantía directamente, sin intermediarios ni comisiones. Deja lo pactado por escrito en el chat." },
        { icono: "estrella", panel: "verde", titulo: "Cuenta cómo te fue", texto: "Si lo contactaste desde LasTresB, puedes dejar una reseña con hechos. Así ayudas a tus vecinos a elegir bien." },
      ],
      boton: { texto: "Buscar un servicio", href: "/buscar", tono: "tinta" },
    },
    {
      id: "proveedor",
      titulo: "Soy proveedor",
      subtexto: "Ofrezco un servicio",
      acento: "ladrillo",
      pasos: [
        { icono: "usuario", panel: "verde", titulo: "Crea tu cuenta gratis", texto: "Regístrate con tu correo o con Google. Debes ser mayor de edad y aceptar los términos." },
        { icono: "perfil", panel: "ladrillo", titulo: "Completa tu perfil", texto: "Cuenta qué servicios ofreces, en qué localidades trabajas y sube fotos de tus trabajos." },
        { icono: "escudo", panel: "amarillo", titulo: "Verificamos tus datos", texto: "Revisamos tu documento y tu WhatsApp antes de publicarte. Algunos servicios piden además RUT o verificación para trabajar con menores." },
        { icono: "qr", panel: "tinta", titulo: "Comparte tu página", texto: "Tendrás una dirección propia (lastresb.com.co/tunombre) y un código QR para volantes y redes. Los clientes te escribirán directo por WhatsApp." },
      ],
      // Un solo ingreso en el sitio: desde /ingreso se elige «Soy proveedor» y sigue el alta.
      boton: { texto: "Regístrame como proveedor", href: "/ingreso", tono: "amarillo" },
    },
  ] satisfies PestanaComo[],
};
