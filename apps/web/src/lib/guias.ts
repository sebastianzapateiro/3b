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
          "LasTresB es un directorio de contacto: el servicio, el precio y la garantía se acuerdan directamente con el proveedor. Por eso conviene dejar por escrito lo pactado en el chat de WhatsApp.",
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
          "Gas y electricidad son trabajos de mayor riesgo. Si huele a gas, ventila y llama a un profesional; no uses interruptores ni llamas. En LasTresB estos servicios exigen RUT verificado desde el alta.",
        ],
      },
    ],
  },
  {
    slug: "seguridad-al-contratar-clases-con-menores",
    titulo: "Seguridad al contratar clases y actividades con menores",
    resumen: "Qué verificar si la persona va a estar a solas con niños o adolescentes en tu casa.",
    fecha: "2026-10-28",
    minutos: 3,
    categoria: "clases-y-refuerzo",
    secciones: [
      {
        titulo: "Verificación de antecedentes",
        parrafos: [
          "Cuando un proveedor trabaja con menores, es razonable pedir una verificación de antecedentes vigente. En LasTresB la insignia «Apto para menores» indica que se revisó ese requisito (Ley 1918) y tiene vigencia limitada, por eso conviene mirar que siga activa.",
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
          "Suspende las clases y reporta lo ocurrido por el canal de reclamos de LasTresB. Ante una situación de riesgo para un menor, acude también a las autoridades.",
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
    categoria: "acarreos-y-transporte",
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
    slug: "como-elegir-un-mecanico-de-confianza",
    titulo: "Cómo elegir un mecánico o taller de confianza en Bogotá",
    resumen: "Qué preguntar, qué pedir por escrito y qué señales de alerta revisar antes de dejar tu carro o tu moto en un taller.",
    fecha: "2026-11-04",
    minutos: 4,
    categoria: "mecanica-y-talleres",
    secciones: [
      {
        titulo: "Antes de dejar el vehículo",
        lista: [
          "Describe el síntoma con detalle: cuándo falla, qué ruido hace, si se enciende alguna luz del tablero.",
          "Pide un diagnóstico antes de la reparación y que te diga qué es urgente y qué puede esperar.",
          "Lee las reseñas: en mecánica pesa mucho que otros clientes cuenten qué se hizo y si el precio final coincidió con el estimado.",
        ],
      },
      {
        titulo: "Qué acordar por escrito",
        lista: [
          "Valor de la mano de obra y de los repuestos por separado.",
          "Que te llamen y esperen tu aprobación si aparece un daño adicional.",
          "Fecha de entrega y garantía del trabajo y de los repuestos.",
          "Que te devuelvan las piezas cambiadas si las quieres ver.",
        ],
      },
      {
        titulo: "Señales de alerta",
        lista: [
          "No quiere dar ningún estimado antes de empezar.",
          "Pide el pago completo por adelantado, más allá de los repuestos.",
          "Cambia piezas que no te explicó o no puede mostrarte el daño.",
          "Se niega a dar garantía por escrito, aunque sea en un mensaje de WhatsApp.",
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
        titulo: "4. Presenta un reclamo en LasTresB",
        parrafos: [
          "Si el proveedor no responde o hay una conducta grave, puedes presentar un reclamo desde la página de reclamos. LasTresB es un directorio de contacto y no garantiza el servicio, pero sí revisa los reportes sobre los perfiles publicados.",
        ],
      },
    ],
  },
  {
    slug: "humedad-en-paredes",
    titulo: "Humedad y moho en las paredes: causas y qué hacer",
    resumen: "Antes de pintar, descubre de dónde viene la humedad. Cómo distinguir filtración, condensación y humedad del piso, y cuándo llamar a un maestro.",
    fecha: "2026-11-04",
    minutos: 4,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Busca la causa, no solo la mancha",
        parrafos: [
          "La pintura tapa, pero no cura. Si la mancha vuelve, el origen sigue ahí. Mira si está cerca de baños, techos, tuberías o en la parte baja del muro.",
        ],
      },
      {
        titulo: "2. Identifica el tipo de humedad",
        lista: [
          "Filtración: mancha que crece tras lluvia o junto a una tubería.",
          "Condensación: gotas en vidrios y esquinas por falta de ventilación.",
          "Humedad del piso: pintura que se ampolla en la base del muro.",
        ],
      },
      {
        titulo: "3. Seca y ventila antes de limpiar el moho",
        parrafos: [
          "Abre ventanas y deja secar la zona. Limpia el moho con un paño y jabón, usando guantes y tapabocas. No mezcles productos de limpieza.",
        ],
      },
      {
        titulo: "4. No pintes sobre pared húmeda",
        parrafos: [
          "La pintura se suelta y el problema reaparece. Espera a que el muro esté completamente seco y, si hay filtración, repárala primero.",
        ],
      },
      {
        titulo: "5. Cuándo llamar a un maestro",
        parrafos: [
          "Si la mancha vuelve, crece o hay desprendimiento de pañete, pide que la revisen un impermeabilizador, un plomero o un pintor, según el origen. Acuerda por escrito qué se arreglará.",
        ],
      },
    ],
  },
  {
    slug: "manchas-de-desodorante-en-la-ropa",
    titulo: "Manchas de desodorante y sudor en la ropa",
    resumen: "Cómo quitar las manchas amarillas de la axila sin dañar la prenda: actúa pronto, prueba en una zona escondida y revisa la etiqueta.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Actúa pronto",
        parrafos: [
          "La mancha reciente sale con más facilidad que la vieja. Enjuaga con agua fría antes de lavar.",
        ],
      },
      {
        titulo: "2. Prueba vinagre blanco",
        parrafos: [
          "Aplica un poco de vinagre blanco con un cepillo suave, primero en una zona escondida de la prenda para confirmar que no destiñe.",
        ],
      },
      {
        titulo: "3. Deja actuar, enjuaga y lava",
        parrafos: [
          "Espera unos minutos, enjuaga y lava como siempre. Revisa la mancha antes de secar: el calor de la secadora puede fijarla.",
        ],
      },
      {
        titulo: "4. Con tela delicada, ve con cuidado",
        parrafos: [
          "En seda, lana o prendas con etiqueta de lavado en seco, sigue la etiqueta. Si es una prenda valiosa, consulta a una lavandería.",
        ],
      },
    ],
  },
  {
    slug: "manchas-de-grasa-y-aceite-en-la-ropa",
    titulo: "Manchas de grasa y aceite en la ropa: qué hacer",
    resumen: "Paso a paso para quitar aceite de la ropa: absorber, cubrir con talco, lavar con desengrasante y no usar la secadora hasta confirmar.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Absorbe el exceso",
        parrafos: [
          "Apoya papel de cocina sobre la mancha sin frotar, para no extenderla.",
        ],
      },
      {
        titulo: "2. Cubre con talco",
        parrafos: [
          "Pon talco o maicena y déjalo actuar un rato. Retira el polvo con un cepillo suave.",
        ],
      },
      {
        titulo: "3. Lava con jabón desengrasante",
        parrafos: [
          "Aplica un poco de jabón lavaplatos desengrasante, frota con suavidad y lava con el programa que indique la etiqueta.",
        ],
      },
      {
        titulo: "4. Revisa antes de secar",
        parrafos: [
          "El calor de la secadora fija la mancha. Si quedó una sombra, repite el proceso y deja secar al aire.",
        ],
      },
    ],
  },
  {
    slug: "errores-plantas-de-interior",
    titulo: "Errores que matan las plantas de interior",
    resumen: "Los tres errores más comunes con las plantas de la casa: regar por rutina, poca luz y macetas sin drenaje. Cómo corregirlos.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Regar por rutina",
        parrafos: [
          "Riega cuando la tierra esté seca al tacto, no según el calendario. El exceso de agua pudre las raíces.",
        ],
      },
      {
        titulo: "2. Luz equivocada",
        parrafos: [
          "Cada planta tiene su necesidad: unas piden luz directa y otras sombra. Observa si se estiran, se queman o pierden color y cámbiala de sitio.",
        ],
      },
      {
        titulo: "3. Maceta sin drenaje",
        parrafos: [
          "Sin huecos en el fondo el agua se estanca. Usa maceta con drenaje y vacía el plato después de regar.",
        ],
      },
      {
        titulo: "4. Observa antes de actuar",
        parrafos: [
          "Las hojas amarillas o caídas avisan. Revisa tierra, luz y plagas antes de añadir abono. Si necesitas apoyo, un jardinero puede orientarte.",
        ],
      },
    ],
  },
  {
    slug: "destapar-canerias-sin-quimicos",
    titulo: "Destapar cañerías y desagües sin químicos",
    resumen: "Qué probar antes de llamar al plomero: destapador de caucho, bicarbonato con vinagre y agua caliente. Y señales de que necesitas un profesional.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Retira residuos y usa el destapador",
        parrafos: [
          "Quita lo que veas en el desagüe y usa un destapador de caucho con movimientos firmes.",
        ],
      },
      {
        titulo: "2. Bicarbonato y vinagre",
        parrafos: [
          "Para obstrucciones leves, echa bicarbonato y luego vinagre. Espera un rato y enjuaga.",
        ],
      },
      {
        titulo: "3. Agua caliente, no hirviendo",
        parrafos: [
          "Ayuda a arrastrar la grasa. El agua hirviendo puede dañar tuberías plásticas.",
        ],
      },
      {
        titulo: "4. Evita mezclar químicos",
        parrafos: [
          "No combines destapadores comerciales entre sí ni con otros productos. Si usas uno, sigue la etiqueta y ventila.",
        ],
      },
      {
        titulo: "5. Cuándo llamar a un plomero",
        parrafos: [
          "Si el agua se devuelve, huele mal o la obstrucción vuelve, llama a un plomero. Pide el alcance del trabajo por escrito.",
        ],
      },
    ],
  },
  {
    slug: "limpieza-del-bano-sarro-y-azulejos",
    titulo: "Limpieza del baño: sarro del inodoro y azulejos",
    resumen: "Cómo quitar el sarro del baño sin dañar superficies: vinagre blanco en loza, cepillo suave, ventilación y constancia.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Vinagre blanco en loza y grifería",
        parrafos: [
          "Aplícalo y déjalo actuar. No lo uses en mármol ni piedra natural, porque los daña.",
        ],
      },
      {
        titulo: "2. Frota con cepillo, no con metal",
        parrafos: [
          "Una esponja metálica raya la loza y los azulejos. Usa cepillo o fibra suave.",
        ],
      },
      {
        titulo: "3. Ventila y seca",
        parrafos: [
          "La humedad atrae moho. Abre ventana o usa extractor y seca superficies después de bañarte.",
        ],
      },
      {
        titulo: "4. Poco y constante",
        parrafos: [
          "Una limpieza corta y frecuente rinde más que una brutal. No mezcles cloro con vinagre ni con otros productos.",
        ],
      },
    ],
  },
  {
    slug: "mezclas-de-limpieza-caseras",
    titulo: "Mezclas de limpieza caseras: lo que sí y lo que nunca",
    resumen: "Antes de copiar un truco viral, conoce la regla de seguridad: nunca mezcles cloro con vinagre, amoníaco o agua oxigenada.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Lo que nunca debes mezclar",
        parrafos: [
          "Nunca mezcles cloro con vinagre, amoníaco o agua oxigenada. Pueden liberar gases irritantes o tóxicos.",
        ],
      },
      {
        titulo: "2. Un producto a la vez",
        parrafos: [
          "Si usas dos productos, enjuaga bien la superficie entre uno y otro.",
        ],
      },
      {
        titulo: "3. Ventila y guarda bien",
        parrafos: [
          "Abre ventanas al limpiar. Guarda los productos en su envase original, rotulados y fuera del alcance de niños y mascotas.",
        ],
      },
      {
        titulo: "4. Ante la duda, no mezcles",
        parrafos: [
          "Si un truco no indica con claridad qué es seguro, mejor no lo hagas. Si inhalaste gas y hay malestar, sal al aire libre y busca atención médica.",
        ],
      },
    ],
  },
  {
    slug: "plagas-en-casa",
    titulo: "Plagas en casa: cucarachas, hormigas y polillas",
    resumen: "Empieza por lo básico: comida tapada, basura a diario, grietas selladas. Y cuándo llamar a un fumigador.",
    fecha: "2026-11-04",
    minutos: 4,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Quita lo que las atrae",
        parrafos: [
          "Las plagas buscan comida, agua y rincones. Guarda la comida tapada y saca la basura a diario.",
        ],
      },
      {
        titulo: "2. Sella y revisa",
        parrafos: [
          "Cierra grietas, revisa desagües, rendijas y detrás de los electrodomésticos.",
        ],
      },
      {
        titulo: "3. Cuida la ropa guardada",
        parrafos: [
          "Para polillas, guarda la ropa limpia y seca, con el armario ventilado.",
        ],
      },
      {
        titulo: "4. Cuándo llamar a un fumigador",
        parrafos: [
          "Si ves nidos o la plaga crece, llama a un fumigador. Pregunta qué productos usará y qué precauciones tomar con niños y mascotas.",
        ],
      },
    ],
  },
  {
    slug: "limpieza-de-cocina-horno-y-microondas",
    titulo: "Limpieza de cocina: horno, microondas y olor a fritura",
    resumen: "Trucos simples para limpiar el microondas, el horno y quitar el olor a fritura sin dañar los electrodomésticos.",
    fecha: "2026-11-04",
    minutos: 4,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Microondas con vapor",
        parrafos: [
          "Calienta un recipiente con agua y limón para soltar la suciedad y limpia con paño suave.",
        ],
      },
      {
        titulo: "2. Horno apagado y frío",
        parrafos: [
          "Desengrasa con esponja suave. Nunca limpies un horno caliente.",
        ],
      },
      {
        titulo: "3. Olor a fritura",
        parrafos: [
          "Ventila y usa la campana extractora. Limpia sus filtros con frecuencia.",
        ],
      },
      {
        titulo: "4. Limpia a tiempo",
        parrafos: [
          "La grasa vieja cuesta más. Una pasada corta tras cocinar evita limpiezas largas.",
        ],
      },
    ],
  },
  {
    slug: "ropa-blanca-y-de-cama",
    titulo: "Ropa blanca y de cama: cada cuánto lavar y cómo blanquear",
    resumen: "Cada cuánto lavar sábanas y cómo mantener la ropa blanca sin cloro: separa colores, prueba antes y sigue la etiqueta.",
    fecha: "2026-11-04",
    minutos: 3,
    categoria: "hogar",
    secciones: [
      {
        titulo: "1. Lava la ropa de cama con frecuencia",
        parrafos: [
          "Sábanas cada una o dos semanas. Con alergias o calor, un poco más seguido.",
        ],
      },
      {
        titulo: "2. Separa blancos de colores",
        parrafos: [
          "Así evitas que se manchen. Lava aparte las prendas nuevas que destiñen.",
        ],
      },
      {
        titulo: "3. Blanquea sin cloro",
        parrafos: [
          "Prueba antes en una zona escondida. No mezcles blanqueadores con otros productos.",
        ],
      },
      {
        titulo: "4. Sigue la etiqueta",
        parrafos: [
          "En telas delicadas, respeta temperatura y programa. Una lavandería puede ayudar con prendas valiosas.",
        ],
      },
    ],
  },
];

export const guiaPorSlug = (slug: string) => GUIAS.find((g) => g.slug === slug);
