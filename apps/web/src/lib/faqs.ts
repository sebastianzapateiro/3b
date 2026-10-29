/**
 * Preguntas frecuentes por sección (SEO + ayuda). Cada página pide las suyas.
 * Respuestas alineadas con las reglas del negocio: gratis, sin comisiones, contacto directo por WhatsApp.
 */
import type { CategoriaPadre } from "@las3b/shared";

export type Pregunta = { pregunta: string; respuesta: string };

const GENERALES = {
  costo: {
    pregunta: "¿Cuánto cuesta usar LasTresB?",
    respuesta: "Nada. Buscar y contactar proveedores es gratis y LasTresB no cobra comisiones. Lo que pagas por el servicio va completo al proveedor.",
  },
  contacto: {
    pregunta: "¿Cómo contacto a un proveedor?",
    respuesta: "Desde su perfil pulsas «Escribir por WhatsApp» y acuerdas con él el servicio, el precio y la fecha, sin intermediarios.",
  },
  responsabilidad: {
    pregunta: "¿LasTresB garantiza el servicio?",
    respuesta: "No. LasTresB es un directorio de contacto: el servicio, el precio y la garantía se acuerdan directamente con cada proveedor. Por eso conviene dejar lo pactado por escrito en el chat.",
  },
  verificacion: {
    pregunta: "¿Qué significa que un proveedor esté verificado?",
    respuesta: "Que revisamos datos básicos como su documento y su WhatsApp antes de publicarlo. La verificación no es una garantía del trabajo; para eso están las reseñas de clientes reales.",
  },
  resenas: {
    pregunta: "¿Las reseñas son reales?",
    respuesta: "Sí. Solo puede reseñar quien contactó al proveedor desde LasTresB, y se permite una reseña por contacto.",
  },
} satisfies Record<string, Pregunta>;

export const FAQ_HOME: Pregunta[] = [
  { pregunta: "¿Qué es LasTresB?", respuesta: "Un directorio de servicios y oficios en Bogotá: buscas por servicio y localidad, comparas reseñas y escribes directo al proveedor por WhatsApp." },
  GENERALES.costo,
  GENERALES.contacto,
  GENERALES.verificacion,
  GENERALES.resenas,
  { pregunta: "¿Funciona en toda Bogotá?", respuesta: "Está pensado para las 20 localidades de Bogotá. Elige la tuya al buscar para ver proveedores que atienden cerca de ti." },
  { pregunta: "Soy proveedor, ¿cómo me registro?", respuesta: "Entra a «Soy proveedor», crea tu cuenta gratis y completa tu perfil. Tendrás tu propia página con dirección lastresb.com.co/tu-nombre, código QR y reseñas de tus clientes." },
];

export const FAQ_CATEGORIAS: Pregunta[] = [
  { pregunta: "¿Qué categorías de servicios hay?", respuesta: "Hogar, Clases y refuerzo, Acarreos y Servicios varios. Dentro de cada una encuentras subcategorías como plomería, electricidad, idiomas o trasteos." },
  { pregunta: "¿Cómo elijo la categoría correcta?", respuesta: "Entra a la categoría general y escoge la subcategoría más cercana a tu necesidad. Si dudas, usa el buscador del inicio con palabras como «plomero» o «clases de inglés»." },
  { pregunta: "¿Por qué algunos servicios exigen más requisitos?", respuesta: "En servicios de mayor riesgo, como gas o electricidad, solo aparecen proveedores con RUT verificado. En los que trabajan con menores se pide verificación de antecedentes." },
  GENERALES.costo,
];

export function faqCategoria(c: CategoriaPadre): Pregunta[] {
  const lista = c.subcategorias.map((s) => s.nombre.toLowerCase()).join(", ");
  const preguntas: Pregunta[] = [
    { pregunta: `¿Qué servicios de ${c.nombre} puedo encontrar?`, respuesta: `En ${c.nombre} encuentras: ${lista}.` },
    { pregunta: `¿Cómo contrato un servicio de ${c.nombre} en Bogotá?`, respuesta: "Elige la subcategoría, filtra por tu localidad, revisa reseñas y escribe al proveedor por WhatsApp para acordar precio y fecha." },
  ];
  if (c.subcategorias.some((s) => s.exigeRutDesdeAlta)) {
    preguntas.push({ pregunta: "¿Por qué piden RUT en algunos servicios?", respuesta: "En servicios de mayor riesgo solo aparecen proveedores con RUT verificado, para que contrates a alguien formalizado." });
  }
  if (c.subcategorias.some((s) => s.exigeInsigniaMenores)) {
    preguntas.push({ pregunta: "¿Qué pasa si el servicio es con menores de edad?", respuesta: "Los proveedores que trabajan con menores tienen verificación de antecedentes (Ley 1918), que se muestra con la insignia «Apto para menores»." });
  }
  preguntas.push(GENERALES.responsabilidad);
  return preguntas;
}

export const FAQ_LOCALIDADES: Pregunta[] = [
  { pregunta: "¿Cubren todas las localidades de Bogotá?", respuesta: "Sí, las 20 localidades de Bogotá están disponibles para buscar. La oferta de proveedores varía según la zona." },
  { pregunta: "¿Cómo busco un proveedor cerca de mí?", respuesta: "Entra a tu localidad, elige el servicio y verás los proveedores que atienden esa zona." },
  { pregunta: "¿Un proveedor puede atender varias localidades?", respuesta: "Sí. Cada proveedor indica las localidades que atiende y aparece en todas ellas." },
  GENERALES.costo,
];

export function faqLocalidad(nombre: string): Pregunta[] {
  return [
    { pregunta: `¿Cómo encuentro un plomero, electricista u otro oficio en ${nombre}?`, respuesta: `Elige el servicio en esta página y verás los proveedores que atienden ${nombre}, con sus reseñas.` },
    { pregunta: `¿Los proveedores de ${nombre} cobran comisión a través de LasTresB?`, respuesta: "No. LasTresB no cobra comisiones; acuerdas el precio directamente con el proveedor." },
    { pregunta: `¿Y si no encuentro mi servicio en ${nombre}?`, respuesta: "Prueba con una localidad vecina o con otra palabra clave. Los proveedores nuevos se suman con frecuencia." },
    GENERALES.contacto,
  ];
}

export const FAQ_GUIAS: Pregunta[] = [
  { pregunta: "¿Para qué sirven las guías?", respuesta: "Para ayudarte a elegir bien: cómo reconocer un buen proveedor, qué acordar por escrito y cómo cuidar tu casa." },
  { pregunta: "¿Las guías reemplazan la asesoría de un profesional?", respuesta: "No. Son recomendaciones generales; para decisiones técnicas o legales consulta a un profesional." },
  GENERALES.responsabilidad,
];

export function faqGuia(slug: string): Pregunta[] {
  const porGuia: Record<string, Pregunta[]> = {
    "como-saber-si-un-proveedor-es-confiable": [
      { pregunta: "¿Es seguro pagar un anticipo?", respuesta: "Puede serlo si es para materiales y está acordado por escrito. Desconfía de quien pide el pago completo antes de empezar." },
      GENERALES.verificacion,
    ],
    "que-pedir-por-escrito-antes-de-contratar-un-servicio": [
      { pregunta: "¿Basta con un mensaje de WhatsApp?", respuesta: "Sí, un resumen claro en el chat con trabajo, precio, fecha y garantía sirve como constancia de lo acordado." },
      { pregunta: "¿Qué hago si el precio cambia durante el trabajo?", respuesta: "Pide que te muestren el motivo y confirma el nuevo valor por escrito antes de continuar." },
    ],
    "mantenimiento-basico-del-hogar-cada-cuanto-revisar": [
      { pregunta: "¿Cada cuánto debo revisar las instalaciones de gas?", respuesta: "Al menos una vez al año, o antes si notas olor o fallas, y siempre con un técnico competente." },
      { pregunta: "¿Qué hago si huelo a gas?", respuesta: "Ventila, no uses interruptores ni llamas y llama a un profesional o a la empresa de gas desde un lugar seguro." },
    ],
    "seguridad-al-contratar-clases-con-menores": [
      { pregunta: "¿Qué es la insignia «Apto para menores»?", respuesta: "Indica que el proveedor presentó la verificación de antecedentes exigida para trabajar con menores (Ley 1918). Tiene vigencia limitada." },
      { pregunta: "¿Puedo estar presente durante las clases?", respuesta: "Sí, y es recomendable al inicio. Un proveedor serio lo entiende." },
    ],
    "como-preparar-un-trasteo-en-bogota": [
      { pregunta: "¿Qué debo decirle al proveedor para que me cotice bien?", respuesta: "Inventario aproximado, direcciones de origen y destino, pisos, acceso con ascensor o escaleras y fotos." },
      { pregunta: "¿Quién responde si se daña algo?", respuesta: "Debe quedar acordado antes con el proveedor. Documenta con fotos el estado de tus cosas." },
    ],
    "que-hacer-si-el-servicio-quedo-mal": [
      { pregunta: "¿Dónde presento un reclamo?", respuesta: "En la página de reclamos de LasTresB. Primero intenta resolverlo con el proveedor por escrito." },
      { pregunta: "¿Puedo dejar una reseña si tuve un mal servicio?", respuesta: "Sí, si contactaste al proveedor desde LasTresB. Cuenta los hechos sin insultos." },
    ],
  };
  return [...(porGuia[slug] ?? []), GENERALES.contacto];
}

export const FAQ_BUSCAR: Pregunta[] = [
  { pregunta: "¿Cómo busco un servicio?", respuesta: "Escribe lo que necesitas, como «plomero» o «clases de inglés», y elige tu localidad. También entiende sinónimos." },
  { pregunta: "¿Por qué no veo resultados?", respuesta: "Prueba otra palabra, quita el filtro de localidad o elige una categoría. Solo se muestran proveedores activos." },
  GENERALES.contacto,
  GENERALES.costo,
];

export const FAQ_PORTAFOLIO: Pregunta[] = [
  GENERALES.contacto,
  GENERALES.verificacion,
  GENERALES.resenas,
  GENERALES.responsabilidad,
];

export const FAQ_TERMINOS: Pregunta[] = [
  { pregunta: "¿Quién puede usar LasTresB?", respuesta: "Personas mayores de 18 años con capacidad legal para contratar." },
  GENERALES.responsabilidad,
  GENERALES.costo,
];

export const FAQ_PRIVACIDAD: Pregunta[] = [
  { pregunta: "¿Qué datos míos son públicos?", respuesta: "Solo lo que aparece en el portafolio del proveedor. Documento, dirección de notificaciones, RUT y fecha de nacimiento nunca se muestran." },
  { pregunta: "¿Cómo ejerzo mis derechos sobre mis datos?", respuesta: "Puedes consultar, rectificar o pedir la supresión de tus datos conforme a la Ley 1581 de 2012, desde los canales indicados en esta política." },
  { pregunta: "¿Qué se guarda al aceptar los términos?", respuesta: "La versión de la política aceptada, la fecha y la dirección IP, como constancia de tu consentimiento." },
];

export const FAQ_RECLAMOS: Pregunta[] = [
  { pregunta: "¿Cuándo debo presentar un reclamo?", respuesta: "Cuando el proveedor no responde, hay una conducta grave o información falsa en su perfil. Antes, intenta resolverlo con él por escrito." },
  { pregunta: "¿LasTresB resuelve disputas de dinero?", respuesta: "No. LasTresB no interviene en pagos ni garantiza el servicio; revisa los reportes sobre los perfiles publicados." },
  GENERALES.resenas,
];

export const FAQ_COMO_FUNCIONA: Pregunta[] = [
  GENERALES.costo,
  GENERALES.contacto,
  GENERALES.verificacion,
  GENERALES.resenas,
  GENERALES.responsabilidad,
  { pregunta: "¿Necesito cuenta para buscar?", respuesta: "No. Puedes buscar y ver perfiles sin registrarte. La cuenta se usa, por ejemplo, para dejar reseñas o para ofrecer tus servicios." },
];

/** Preguntas de las páginas /servicios/[sub] y /servicios/[sub]/[localidad]. */
export function faqServicio(o: { nombre: string; localidad?: string; menores: boolean; rut: boolean }): Pregunta[] {
  const donde = o.localidad ? `${o.localidad}, Bogotá` : "Bogotá";
  const minus = o.nombre.toLowerCase();
  const preguntas: Pregunta[] = [
    { pregunta: `¿Cómo encuentro ${minus} en ${donde}?`, respuesta: `Revisa los proveedores de esta página, compara sus reseñas y escríbeles por WhatsApp. También puedes afinar con el buscador por localidad y filtros de confianza.` },
    { pregunta: `¿Cuánto cuesta ${minus} en ${donde}?`, respuesta: "Depende del trabajo. Cada proveedor muestra en su página un «precio desde» orientativo; el valor final lo acuerdas con él antes de empezar. Pide la cotización por escrito." },
    { pregunta: `¿Cómo sé si un proveedor de ${minus} es confiable?`, respuesta: "Mira sus reseñas de clientes reales, las insignias de verificación y las fotos de trabajos. Nuestra guía «Cómo saber si un proveedor es confiable» te da más señales." },
  ];
  if (o.rut) preguntas.push({ pregunta: "¿Por qué piden RUT para este servicio?", respuesta: "Es un servicio de mayor riesgo: solo aparecen proveedores con RUT verificado, para que contrates a alguien formalizado." });
  if (o.menores) preguntas.push({ pregunta: "¿Qué verificaciones hay si el servicio es con menores?", respuesta: "Los proveedores que trabajan con menores presentan verificación de antecedentes (Ley 1918) y se identifican con la insignia «Apto para menores», que tiene vigencia limitada." });
  preguntas.push(GENERALES.costo, GENERALES.contacto);
  return preguntas;
}

export const FAQ_COOKIES: Pregunta[] = [
  { pregunta: "¿Puedo usar LasTresB sin aceptar cookies de analítica?", respuesta: "Sí. Las cookies necesarias bastan para buscar, ver perfiles y contactar. La analítica es opcional y solo se activa si la aceptas." },
  { pregunta: "¿Cómo cambio mi decisión?", respuesta: "Usa el enlace «Configurar cookies» en el pie de cualquier página y elige de nuevo." },
  { pregunta: "¿Usan cookies de publicidad?", respuesta: "No. Hoy solo usamos cookies necesarias y, con tu permiso, analítica agregada." },
];

export const FAQ_RESENAS: Pregunta[] = [
  GENERALES.resenas,
  { pregunta: "¿Puede un proveedor borrar o editar una reseña?", respuesta: "No. Solo puede responderla una vez. Si cree que infringe esta política, la reporta y el equipo la revisa." },
  { pregunta: "¿Se pueden comprar reseñas?", respuesta: "No. Ofrecer o pedir pagos, descuentos o favores a cambio de reseñas está prohibido y puede llevar a la suspensión del perfil." },
  { pregunta: "¿Cómo se calcula la calificación?", respuesta: "Cada reseña promedia cuatro criterios (puntualidad, calidad, calidad-precio y cumplimiento). La calificación del proveedor es el promedio de sus reseñas visibles." },
];

export const FAQ_TERMINOS_PROVEEDORES: Pregunta[] = [
  { pregunta: "¿LasTresB me cobra comisión?", respuesta: "No. Acuerdas precio, fecha y garantía directamente con tus clientes y LasTresB no recibe dinero por tus servicios." },
  { pregunta: "¿Quién es dueño de mis fotos?", respuesta: "Tú. Nos das una licencia no exclusiva y gratuita, mientras tengas perfil, para mostrarlas en el portal y compartirlas para promocionar tu perfil." },
  { pregunta: "¿Pueden suspender mi perfil?", respuesta: "Sí, si incumples los términos. Normalmente te avisamos el motivo y tienes 5 días hábiles para dar tu versión; en casos de fraude o riesgo para personas puede ser inmediato y provisional." },
  { pregunta: "¿Puedo borrar una reseña que no me gusta?", respuesta: "No. Puedes responderla una vez y reportarla si incumple la política de reseñas." },
];

export const FAQ_RETIRO: Pregunta[] = [
  { pregunta: "¿Qué pasa cuando reporto un contenido?", respuesta: "Lo revisamos, y si incumple lo ocultamos y avisamos al proveedor, que puede responder y aportar pruebas." },
  { pregunta: "¿Necesito cuenta para reportar?", respuesta: "No. Solo necesitas un correo para que podamos contactarte." },
  { pregunta: "¿Puedo reportar una reseña o un perfil?", respuesta: "Sí, con el botón «Reportar este perfil» o desde la página de reclamos." },
];
