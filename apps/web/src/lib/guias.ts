/**
 * Guías (P2, SEO): artículos para quien contrata servicios en Bogotá.
 * Contenido editorial propio; sin cifras ni precios inventados. Lo leen /guias y /guias/[slug].
 */
export type Guia = {
  slug: string;
  titulo: string;
  resumen: string;
  /** Fecha ISO de publicación (también para JSON-LD). */
  fecha: string;
  minutos: number;
  /** Categoría padre relacionada (slug), para enlazar a /categorias/[slug]. */
  categoria?: string;
  secciones: { titulo: string; parrafos?: string[]; lista?: string[] }[];
};

export const GUIAS: Guia[] = [
  {
    slug: "como-saber-si-un-proveedor-es-confiable",
    titulo: "Cómo saber si un proveedor es confiable (y señales de alerta)",
    resumen: "Seis cosas que puedes revisar antes de contratar a alguien que no conoces, y las señales que piden frenar.",
    fecha: "2026-10-28",
    minutos: 4,
    secciones: [
      {
        titulo: "Qué revisar antes de escribirle",
        lista: [
          "Reseñas de clientes reales: lee las más recientes y fíjate si cuentan qué trabajo se hizo, no solo «excelente».",
          "Fotos de trabajos anteriores que se vean propias, no de catálogo.",
          "Insignias de verificación: indican qué datos revisó el directorio, no que el trabajo esté garantizado.",
          "Que atienda tu localidad. Alguien que ofrece «toda Bogotá» sin dar detalles merece una pregunta más.",
        ],
      },
      {
        titulo: "Preguntas que conviene hacer",
        lista: [
          "¿Qué incluye exactamente el precio: mano de obra, materiales, desplazamiento?",
          "¿Cuánto tardaría y desde qué fecha puede empezar?",
          "¿Da garantía del trabajo y por cuánto tiempo?",
          "¿Puede mostrarme un trabajo parecido al mío?",
        ],
      },
      {
        titulo: "Señales de alerta",
        lista: [
          "Pide el pago completo por adelantado, sobre todo si no tiene materiales ni visita previa.",
          "Presiona para decidir «hoy» con un descuento que desaparece.",
          "No quiere dar su nombre completo ni mostrar trabajos anteriores.",
          "Cotiza sin ver el problema, en un trabajo que claramente necesita revisión.",
        ],
      },
      {
        titulo: "Recuerda",
        parrafos: [
          "Las 3B es un directorio de contacto: el servicio, el precio y la garantía se acuerdan directamente con el proveedor. Por eso conviene dejar por escrito lo pactado en el chat de WhatsApp.",
        ],
      },
    ],
  },
  {
    slug: "que-pedir-por-escrito-antes-de-contratar-un-servicio",
    titulo: "Qué dejar por escrito antes de contratar un servicio en casa",
    resumen: "Un mensaje de WhatsApp bien redactado te ahorra malentendidos. Esto es lo mínimo que debe quedar acordado.",
    fecha: "2026-10-28",
    minutos: 3,
    secciones: [
      {
        titulo: "Los cinco puntos mínimos",
        lista: [
          "Qué trabajo se hará, descrito con tus palabras.",
          "Precio total y qué incluye (materiales, transporte, mano de obra).",
          "Fecha y hora de llegada, y cuánto tiempo se estima.",
          "Garantía: qué cubre y por cuánto tiempo.",
          "Forma de pago y cuándo se paga (por ejemplo, un anticipo para materiales y el resto al terminar).",
        ],
      },
      {
        titulo: "Cómo hacerlo sin que parezca desconfianza",
        parrafos: [
          "Basta con cerrar la conversación con un resumen: «Entonces quedamos el jueves a las 9, cambio de llave del lavaplatos, $X con materiales incluidos. ¿Confirmas?». Cualquier proveedor serio lo agradece.",
        ],
      },
      {
        titulo: "Si algo cambia en el camino",
        parrafos: [
          "Si aparece un daño adicional, pide que te lo muestre y que te diga el costo extra antes de continuar. Vuelve a confirmarlo por escrito.",
        ],
      },
    ],
  },
  {
    slug: "mantenimiento-basico-del-hogar-cada-cuanto-revisar",
    titulo: "Mantenimiento básico del hogar: qué revisar y cada cuánto",
    resumen: "Una lista sencilla para anticiparte a las fallas más comunes en apartamentos y casas de Bogotá.",
    fecha: "2026-10-28",
    minutos: 4,
    categoria: "hogar",
    secciones: [
      {
        titulo: "Cada mes",
        lista: [
          "Revisa llaves, sifones y desagües: goteos pequeños suelen ser el aviso de algo mayor.",
          "Mira esquinas de techos y paredes en busca de manchas de humedad.",
          "Prueba el funcionamiento de los breaker del tablero.",
        ],
      },
      {
        titulo: "Cada seis meses",
        lista: [
          "Limpia canales y bajantes antes de las temporadas de lluvia.",
          "Revisa el estado de sellos y silicona en baños y cocina.",
          "Pide una revisión de cerraduras y bisagras si alguna se siente floja.",
        ],
      },
      {
        titulo: "Cada año",
        lista: [
          "Lavado de tanques de agua, si tu edificio o casa los tiene.",
          "Revisión de las instalaciones de gas por un técnico competente.",
          "Mantenimiento de neveras, lavadoras y aire acondicionado según indique el fabricante.",
        ],
      },
      {
        titulo: "Cuándo no improvisar",
        parrafos: [
          "Gas y electricidad son trabajos de mayor riesgo. Si huele a gas, ventila y llama a un profesional; no uses interruptores ni llamas. En Las 3B estos servicios exigen RUT verificado desde el alta.",
        ],
      },
    ],
  },
  {
    slug: "seguridad-al-contratar-clases-o-cuidado-con-menores",
    titulo: "Seguridad al contratar clases o cuidado cuando hay menores",
    resumen: "Qué verificar si la persona va a estar a solas con niños o adolescentes en tu casa.",
    fecha: "2026-10-28",
    minutos: 3,
    categoria: "clases-y-refuerzo",
    secciones: [
      {
        titulo: "Verificación de antecedentes",
        parrafos: [
          "Cuando un proveedor trabaja con menores, es razonable pedir una verificación de antecedentes vigente. En Las 3B la insignia «Apto para menores» indica que se revisó ese requisito (Ley 1918) y tiene vigencia limitada, por eso conviene mirar que siga activa.",
        ],
      },
      {
        titulo: "Buenas prácticas en casa",
        lista: [
          "Haz la primera clase con un adulto presente.",
          "Prefiere un espacio común de la casa, con la puerta abierta.",
          "Habla con el menor después de las primeras sesiones y pregúntale cómo se sintió.",
          "Si es online, conoce la plataforma y deja la sesión en un lugar visible.",
        ],
      },
      {
        titulo: "Si algo no se siente bien",
        parrafos: [
          "Suspende las clases y reporta lo ocurrido por el canal de reclamos de Las 3B. Ante una situación de riesgo para un menor, acude también a las autoridades.",
        ],
      },
    ],
  },
  {
    slug: "como-preparar-un-trasteo-en-bogota",
    titulo: "Cómo preparar un trasteo o mudanza de barrio en Bogotá",
    resumen: "Pasos para coordinar el acarreo, evitar sorpresas con el precio y proteger tus cosas.",
    fecha: "2026-10-28",
    minutos: 4,
    categoria: "acarreos",
    secciones: [
      {
        titulo: "Antes de cotizar",
        lista: [
          "Haz un inventario simple: muebles grandes, electrodomésticos y número aproximado de cajas.",
          "Anota si hay escaleras, ascensor o calles de difícil acceso en origen y destino.",
          "Comparte fotos al escribir al proveedor para que la cotización sea realista.",
        ],
      },
      {
        titulo: "Qué acordar",
        lista: [
          "Precio total y qué pasa si el trabajo dura más de lo previsto.",
          "Cuántas personas irán a cargar y qué tipo de vehículo llevan.",
          "Si empacan ellos o lo haces tú, y si incluyen materiales de embalaje.",
          "Quién responde si algo se daña y cómo se reporta.",
        ],
      },
      {
        titulo: "El día del trasteo",
        lista: [
          "Ten a la mano los objetos de valor y documentos; llévalos contigo.",
          "Revisa las cajas frágiles y rotúlalas.",
          "Confirma el estado de los muebles al subir y al bajar, de preferencia con fotos.",
        ],
      },
    ],
  },
  {
    slug: "que-hacer-si-el-servicio-quedo-mal",
    titulo: "¿Qué hacer si el servicio quedó mal?",
    resumen: "Pasos para reclamar con calma, dejar evidencia y buscar una solución con el proveedor.",
    fecha: "2026-10-28",
    minutos: 3,
    secciones: [
      {
        titulo: "1. Documenta",
        parrafos: [
          "Toma fotos o video del problema y guarda la conversación de WhatsApp con lo que se acordó: precio, fecha y garantía.",
        ],
      },
      {
        titulo: "2. Escríbele al proveedor",
        parrafos: [
          "Cuéntale qué ocurrió, qué esperabas y qué solución propones: repetir el trabajo, corregirlo o ajustar el pago. La mayoría de problemas se arreglan en esta etapa si el mensaje es claro y respetuoso.",
        ],
      },
      {
        titulo: "3. Deja tu reseña con hechos",
        parrafos: [
          "Una reseña útil cuenta qué se contrató y qué pasó, sin insultos. Así ayuda a otros vecinos y le da al proveedor la oportunidad de responder.",
        ],
      },
      {
        titulo: "4. Presenta un reclamo en Las 3B",
        parrafos: [
          "Si el proveedor no responde o hay una conducta grave, puedes presentar un reclamo desde la página de reclamos. Las 3B es un directorio de contacto y no garantiza el servicio, pero sí revisa los reportes sobre los perfiles publicados.",
        ],
      },
    ],
  },
];

export const guiaPorSlug = (slug: string) => GUIAS.find((g) => g.slug === slug);
