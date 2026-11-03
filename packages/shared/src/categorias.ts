import { sugerirSlug } from "./slug";

/**
 * Taxonomía de categorías y oficios (P2, CU-03). Fuente única: la leen la semilla de la base, el Home,
 * /categorias y las páginas SEO /servicios/[oficio]. Fuente de negocio: casos de uso, sección 5.7.
 *
 * REGLA DE NEGOCIO: LasTresB NO ofrece transporte de personas ni servicios de salud o cuidado de personas.
 * Ningún oficio, palabra clave o sinónimo de ese tipo puede existir aquí (ver `contieneServicioProhibido`).
 * «Fletes» y «Trasteos» transportan solo carga.
 */

export type Seo = {
  /** Palabra principal de búsqueda (lleva «en Bogotá»). */
  principal: string;
  /** Búsquedas relacionadas y sinónimos: alimentan `terminos_busqueda`. */
  relacionadas: string[];
  /** Problemas típicos: chips de la página y preguntas frecuentes. */
  problemas: string[];
  /** Introducción propia del oficio (2 o 3 frases). */
  intro: string;
};

export type Subcategoria = {
  nombre: string;
  /** Slug del oficio: /servicios/[slug]. */
  slug: string;
  /** Aclaración corta para tarjetas y listas. */
  detalle?: string;
  /** Subgrupo (solo Hogar). */
  subgrupo?: string;
  popular: boolean;
  atiendeUrgencias: boolean;
  exigeInsigniaMenores: boolean;
  exigeRutDesdeAlta: boolean;
  /** Pide matrícula, tarjeta profesional o certificación del oficio antes de aprobar. */
  exigeMatricula: boolean;
  seo: Seo;
  /** Palabras clave y sinónimos para la búsqueda (terminos_busqueda). */
  claves: string;
};

export type CategoriaPadre = {
  nombre: string;
  slug: string;
  icono: "casa" | "libro" | "camion" | "herramienta" | "huella" | "maletin";
  corto: string;
  descripcion: string;
  subcategorias: Subcategoria[];
};

type Fuente = {
  nombre: string;
  slug: string;
  detalle?: string;
  subgrupo?: string;
  popular?: boolean;
  urgencias?: boolean;
  menores?: boolean;
  rut?: boolean;
  matricula?: boolean;
  principal: string;
  relacionadas: string[];
  problemas?: string[];
  intro: string;
};

function oficio(f: Fuente): Subcategoria {
  const seo: Seo = { principal: f.principal, relacionadas: f.relacionadas, problemas: f.problemas ?? [], intro: f.intro };
  const base = f.principal.replace(/ en Bogotá$/i, "");
  return {
    nombre: f.nombre,
    slug: f.slug,
    detalle: f.detalle,
    subgrupo: f.subgrupo,
    popular: f.popular ?? false,
    atiendeUrgencias: f.urgencias ?? false,
    exigeInsigniaMenores: f.menores ?? false,
    exigeRutDesdeAlta: f.rut ?? false,
    exigeMatricula: f.matricula ?? false,
    seo,
    claves: [f.nombre, base, ...f.relacionadas].join(", "),
  };
}

function padre(p: Omit<CategoriaPadre, "slug" | "subcategorias"> & { oficios: Fuente[] }): CategoriaPadre {
  const { oficios, ...resto } = p;
  return { ...resto, slug: sugerirSlug(p.nombre), subcategorias: oficios.map(oficio) };
}

const REPARACIONES = "Reparaciones";
const OBRA = "Obra y acabados";
const INSTALACIONES = "Instalaciones";
const LIMPIEZA = "Limpieza y jardín";

export const CATEGORIAS: CategoriaPadre[] = [
  padre({
    nombre: "Hogar",
    icono: "casa",
    corto: "Plomería, luz, pintura",
    descripcion: "Plomería, electricidad, pintura, cerrajería",
    oficios: [
      { nombre: "Plomería", slug: "plomero", subgrupo: REPARACIONES, popular: true, urgencias: true, principal: "plomero en Bogotá", relacionadas: ["fontanero", "destapar cañería", "destape de lavaplatos", "sanitario tapado", "fuga de agua", "cambio de grifería", "tubería", "goteo", "inodoro"], problemas: ["Destape de cañería", "Lavaplatos tapado", "Sanitario tapado", "Fuga de agua", "Cambio de grifería"], intro: "Un plomero resuelve fugas, tapones y daños en tuberías, sanitarios y griferías. Aquí encuentras plomeros de Bogotá, con reseñas de clientes reales, y acuerdas el precio directo por WhatsApp antes de que empiece el trabajo." },
      { nombre: "Electricidad", slug: "electricista", subgrupo: REPARACIONES, popular: true, urgencias: true, rut: true, principal: "electricista en Bogotá", relacionadas: ["arreglo de luces", "se fue la luz", "corto circuito", "salta el taco", "instalación de lámparas", "tomas e interruptores", "breakers", "cableado"], problemas: ["Se fue la luz", "Salta el taco", "Corto circuito", "Lámparas e interruptores", "Cambio de breakers"], intro: "El trabajo eléctrico es de mayor riesgo, por eso aquí solo aparecen electricistas con RUT verificado. Pide la cotización por escrito y pregunta por la garantía antes de contratar." },
      { nombre: "Gas", slug: "tecnico-de-gas", subgrupo: REPARACIONES, urgencias: true, rut: true, principal: "técnico de gas en Bogotá", relacionadas: ["instalación de estufa a gas", "calentador a gas", "revisión de gasodomésticos", "fuga de gas"], problemas: ["Instalar estufa a gas", "Revisión de gasodomésticos", "Calentador a gas"], intro: "Instalación y revisión de estufas, hornos y calentadores a gas. Es un servicio de mayor riesgo: solo se muestran técnicos con RUT verificado." },
      { nombre: "Técnico de neveras", slug: "tecnico-de-neveras", subgrupo: REPARACIONES, principal: "técnico de neveras en Bogotá", relacionadas: ["nevera no enfría", "nevecón", "congelador", "arreglo de neveras", "refrigeración"], problemas: ["La nevera no enfría", "Hace ruido", "Bota agua", "Congelador dañado"], intro: "Diagnóstico y reparación de neveras, nevecones y congeladores a domicilio. Cuéntale al técnico la marca y el síntoma para que te dé un estimado." },
      { nombre: "Técnico de lavadoras", slug: "tecnico-de-lavadoras", subgrupo: REPARACIONES, principal: "técnico de lavadoras en Bogotá", relacionadas: ["lavadora no centrifuga", "secadora", "centro de lavado", "arreglo de lavadoras"], problemas: ["No centrifuga", "No desagua", "Hace ruido", "Secadora que no seca"], intro: "Reparación de lavadoras, secadoras y centros de lavado en tu casa. Pregunta si el diagnóstico tiene costo y si la reparación incluye garantía." },
      { nombre: "Cerrajería", slug: "cerrajero", subgrupo: REPARACIONES, popular: true, urgencias: true, principal: "cerrajero en Bogotá", relacionadas: ["cerrajero 24 horas", "abrir puerta", "me quedé por fuera", "cambio de guarda", "cerraduras", "llaves"], problemas: ["Me quedé por fuera", "Cambio de guarda", "Abrir puerta", "Copia de llaves", "Cerradura dañada"], intro: "Apertura de puertas, cambio de guardas y cerraduras. Algunos cerrajeros declaran atender urgencias y 24 horas: míralo en sus etiquetas y confirma disponibilidad por WhatsApp." },
      { nombre: "Vidrios y ventanería", slug: "vidriero", subgrupo: REPARACIONES, urgencias: true, principal: "vidriero en Bogotá", relacionadas: ["vidrio roto", "ventanas", "espejos", "división de baño", "ventanal"], problemas: ["Vidrio roto", "Ventana que no cierra", "Espejos a medida", "División de baño"], intro: "Cambio de vidrios rotos, ventanas, espejos y divisiones de baño. Algunos vidrieros atienden urgencias; confirma por WhatsApp." },
      { nombre: "Mantenimiento de calentadores", slug: "mantenimiento-de-calentadores", subgrupo: REPARACIONES, rut: true, principal: "arreglo de calentadores en Bogotá", relacionadas: ["calentador no calienta el agua", "calentador de paso", "calentador de acumulación", "mantenimiento de calentador"], problemas: ["No calienta el agua", "Se apaga la llama", "Mantenimiento anual"], intro: "Mantenimiento y reparación de calentadores de paso y de acumulación. Por el riesgo del gas, solo aparecen técnicos con RUT verificado." },
      { nombre: "Lavado de tanques", slug: "lavado-de-tanques", subgrupo: REPARACIONES, principal: "lavado de tanques de agua en Bogotá", relacionadas: ["tanque elevado", "tanque subterráneo", "desinfección de tanques"], problemas: ["Tanque elevado", "Tanque subterráneo", "Desinfección"], intro: "Lavado y desinfección de tanques de agua de casas y edificios. Pregunta qué productos usan y si entregan constancia del servicio." },

      { nombre: "Construcción y remodelación", slug: "maestro-de-obra", subgrupo: OBRA, rut: true, principal: "maestro de obra en Bogotá", relacionadas: ["remodelación", "albañil", "enchape", "baldosa", "remodelar cocina", "remodelar baño"], problemas: ["Remodelar cocina", "Remodelar baño", "Enchape de baldosa", "Obra en casa"], intro: "Maestros de obra y albañiles para remodelar cocinas, baños y espacios. Por la envergadura del trabajo, aparecen con RUT verificado: pide cotización detallada por escrito." },
      { nombre: "Pintura y acabados", slug: "pintor", subgrupo: OBRA, principal: "pintor de apartamentos en Bogotá", relacionadas: ["pintar apartamento", "pintor de casas", "estuco", "resanes", "fachadas", "drywall"], problemas: ["Pintar apartamento", "Estuco y resanes", "Fachadas", "Drywall"], intro: "Pintores para apartamentos y casas: estuco, resanes, fachadas y drywall. Cuéntale los metros cuadrados para que te cotice con precisión." },
      { nombre: "Techos e impermeabilización", slug: "impermeabilizacion", subgrupo: OBRA, urgencias: true, rut: true, principal: "arreglo de goteras en Bogotá", relacionadas: ["impermeabilización", "goteras", "tejas", "canales", "humedad en paredes", "filtraciones"], problemas: ["Goteras", "Humedad en paredes", "Tejas rotas", "Canales tapadas"], intro: "Arreglo de goteras, impermeabilización de terrazas y cambio de tejas y canales. Algunos proveedores declaran atender urgencias en época de lluvias." },
      { nombre: "Pisos", slug: "instalador-de-pisos", subgrupo: OBRA, detalle: "Laminado, madera, pulido", principal: "instalación de pisos en Bogotá", relacionadas: ["piso laminado", "piso de madera", "pulido de pisos", "vinilo", "guardaescobas"], problemas: ["Piso laminado", "Piso de madera", "Pulido de pisos", "Guardaescobas"], intro: "Instalación de pisos laminados, de madera y vinilo, y pulido de pisos. Pide que midan el espacio antes de cotizar." },
      { nombre: "Soldadura y ornamentación", slug: "ornamentador", subgrupo: OBRA, rut: true, principal: "ornamentador en Bogotá", relacionadas: ["soldador", "rejas", "puertas metálicas", "pasamanos", "estructuras"], problemas: ["Rejas", "Puertas metálicas", "Pasamanos", "Soldadura en casa"], intro: "Rejas, puertas metálicas, pasamanos y trabajos de soldadura a medida. Aparecen con RUT verificado." },
      { nombre: "Carpintería", slug: "carpintero", subgrupo: OBRA, principal: "carpintero en Bogotá", relacionadas: ["muebles a medida", "clósets", "puertas de madera", "cocinas integrales", "ebanista"], problemas: ["Muebles a medida", "Clósets", "Puertas de madera", "Cocinas integrales"], intro: "Carpinteros para muebles a medida, clósets, puertas y cocinas integrales. Revisa las fotos de trabajos anteriores en cada perfil." },
      { nombre: "Tapicería y retapizado", slug: "tapicero", subgrupo: OBRA, principal: "tapicero en Bogotá", relacionadas: ["retapizar sofá", "sillas de comedor", "cabeceros", "tapicería"], problemas: ["Retapizar sofá", "Sillas de comedor", "Cabeceros"], intro: "Retapizado de sofás, sillas y cabeceros. Cuando pidas la cotización, ten a la mano fotos y medidas del mueble." },

      { nombre: "Todero", slug: "todero", subgrupo: INSTALACIONES, popular: true, detalle: "Instalaciones y montajes", principal: "todero en Bogotá", relacionadas: ["maestro todero", "instalar soporte de TV", "colgar cuadros", "repisas", "armar muebles", "perforar con taladro", "arreglos varios"], problemas: ["Colgar cuadros y repisas", "Soporte de TV", "Armar muebles", "Arreglos varios"], intro: "El todero resuelve los arreglos pequeños de la casa: colgar cuadros, armar muebles, instalar repisas y soportes de TV. Ideal cuando no sabes qué oficio necesitas." },
      { nombre: "Cortinas y persianas", slug: "cortinas-y-persianas", subgrupo: INSTALACIONES, principal: "instalación de cortinas y persianas en Bogotá", relacionadas: ["rieles", "enrollables", "blackout", "toldos"], problemas: ["Rieles", "Persianas enrollables", "Blackout", "Toldos"], intro: "Instalación de cortinas, rieles, persianas y toldos. Ten las medidas de las ventanas para agilizar la cotización." },
      { nombre: "Instalación de TV y antenas", slug: "instalador-de-tv-y-antenas", subgrupo: INSTALACIONES, principal: "instalación de TV y antenas en Bogotá", relacionadas: ["soporte de TV", "antena parabólica", "TV por cable", "barra de sonido"], problemas: ["Soporte de TV", "Antena parabólica", "Barra de sonido"], intro: "Montaje de televisores en pared, antenas y barras de sonido. Pregunta si llevan el soporte o debes tenerlo listo." },
      { nombre: "Seguridad", slug: "instalador-de-camaras", subgrupo: INSTALACIONES, detalle: "Cámaras, citófonos, alarmas", principal: "instalación de cámaras de seguridad en Bogotá", relacionadas: ["cámaras", "citófonos", "alarmas", "CCTV", "cerca eléctrica"], problemas: ["Cámaras de seguridad", "Citófonos", "Alarmas"], intro: "Instalación de cámaras, citófonos y alarmas para casas y apartamentos. Compara las propuestas y pregunta por el soporte posterior." },

      { nombre: "Aseo y limpieza", slug: "aseo", subgrupo: LIMPIEZA, principal: "aseo y limpieza de hogar en Bogotá", relacionadas: ["aseo", "limpieza", "aseadora", "señora del aseo", "limpieza de hogar", "lavado de muebles", "alfombras", "colchones"], problemas: ["Aseo de apartamento", "Limpieza profunda", "Lavado de muebles", "Alfombras y colchones"], intro: "Aseo y limpieza de casas y apartamentos, y lavado de muebles, alfombras y colchones. Acuerda con la persona las tareas y el valor, y déjalo por escrito en el chat." },
      { nombre: "Fumigación", slug: "fumigador", subgrupo: LIMPIEZA, rut: true, principal: "fumigación en Bogotá", relacionadas: ["cucarachas", "ratones", "chinches", "control de plagas"], problemas: ["Cucarachas", "Ratones", "Chinches", "Control de plagas"], intro: "Control de plagas en casas, apartamentos y locales. Por el manejo de productos, aparecen fumigadores con RUT verificado." },
      { nombre: "Jardinería", slug: "jardinero", subgrupo: LIMPIEZA, principal: "jardinero en Bogotá", relacionadas: ["poda", "mantenimiento de jardín", "corte de césped"], problemas: ["Poda", "Corte de césped", "Mantenimiento de jardín"], intro: "Poda, corte de césped y mantenimiento de jardines y antejardines. Define la frecuencia del servicio al cotizar." },
    ],
  }),
  padre({
    nombre: "Clases y refuerzo",
    icono: "libro",
    corto: "Inglés, mate, música",
    descripcion: "Matemáticas, inglés, música, tareas",
    oficios: [
      { nombre: "Refuerzo escolar", slug: "profesor-particular", menores: true, principal: "profesor particular en Bogotá", relacionadas: ["refuerzo escolar", "tareas", "nivelación", "tutor de primaria y bachillerato"], problemas: ["Tareas", "Nivelación", "Primaria", "Bachillerato"], intro: "Profesores particulares para tareas y nivelación de primaria y bachillerato. Quienes trabajan con menores tienen verificación de antecedentes." },
      { nombre: "Matemáticas y ciencias", slug: "clases-de-matematicas", menores: true, principal: "clases de matemáticas en Bogotá", relacionadas: ["profesor de matemáticas", "física", "química", "cálculo", "álgebra"], problemas: ["Álgebra", "Cálculo", "Física", "Química"], intro: "Clases de matemáticas, física, química y cálculo a domicilio. Cuéntale al profesor el curso y el tema que necesitas reforzar." },
      { nombre: "Idiomas", slug: "profesor-de-ingles", menores: true, detalle: "Inglés y más", principal: "clases de inglés a domicilio en Bogotá", relacionadas: ["profesor de inglés", "conversación", "TOEFL", "IELTS", "francés"], problemas: ["Conversación", "TOEFL", "IELTS", "Inglés para niños"], intro: "Profesores de inglés y otros idiomas, presenciales o virtuales. Define tu nivel y objetivo para que el profesor te proponga un plan." },
      { nombre: "Preicfes", slug: "preicfes", menores: true, principal: "preicfes en Bogotá", relacionadas: ["clases preicfes", "Saber 11", "preuniversitario", "ICFES"], problemas: ["Simulacros", "Saber 11", "Preuniversitario"], intro: "Preparación para la prueba Saber 11 con profesores que dictan clases individuales o en grupo." },
      { nombre: "Música", slug: "clases-de-musica", menores: true, principal: "clases de guitarra en Bogotá", relacionadas: ["clases de piano", "canto", "música a domicilio", "violín", "batería"], problemas: ["Guitarra", "Piano", "Canto"], intro: "Clases de guitarra, piano, canto y otros instrumentos en tu casa o en la del profesor." },
      { nombre: "Lectura y escritura", slug: "clases-de-lectura-y-escritura", menores: true, principal: "clases de lectura y escritura en Bogotá", relacionadas: ["comprensión de lectura", "ortografía", "redacción", "refuerzo de lectoescritura"], problemas: ["Comprensión de lectura", "Ortografía", "Redacción"], intro: "Refuerzo de lectura, ortografía y redacción para niños y jóvenes, con profesores que acompañan el ritmo de cada estudiante." },
      { nombre: "Programación y tecnología", slug: "clases-de-programacion", menores: true, principal: "clases de programación para niños en Bogotá", relacionadas: ["Scratch", "Python", "robótica", "informática"], problemas: ["Scratch", "Python", "Robótica"], intro: "Clases de programación, robótica e informática para niños y jóvenes, desde juegos con Scratch hasta Python." },
      { nombre: "Arte y dibujo", slug: "clases-de-dibujo", menores: true, principal: "clases de dibujo en Bogotá", relacionadas: ["pintura", "acuarela", "manualidades", "arte para niños"], problemas: ["Dibujo", "Acuarela", "Manualidades"], intro: "Clases de dibujo, pintura y manualidades para niños y adultos." },
      { nombre: "Baile", slug: "clases-de-baile", menores: true, principal: "clases de baile en Bogotá", relacionadas: ["salsa", "bachata", "danza", "baile para niños"], problemas: ["Salsa", "Bachata", "Danza"], intro: "Clases de salsa, bachata y otros ritmos, individuales o en grupo." },
      { nombre: "Computador y celular para adultos", slug: "clases-de-computador", principal: "clases de computador y celular para adultos en Bogotá", relacionadas: ["aprender a usar el celular", "WhatsApp", "correo", "ofimática"], problemas: ["Usar el celular", "WhatsApp", "Correo electrónico", "Ofimática"], intro: "Clases pacientes para aprender a usar el computador y el celular: WhatsApp, correo, trámites en línea y ofimática." },
    ],
  }),
  padre({
    nombre: "Acarreos y transporte",
    icono: "camion",
    corto: "Trasteos y fletes",
    descripcion: "Trasteos, fletes y acarreos de carga",
    oficios: [
      { nombre: "Trasteos y mudanzas", slug: "trasteos", popular: true, detalle: "Mudanzas de barrio, objetos pesados", principal: "trasteos en Bogotá", relacionadas: ["trasteos baratos", "mudanzas", "acarreos", "camión para trasteo", "furgón"], problemas: ["Trasteo de apartamento", "Mudanza de barrio", "Objetos pesados"], intro: "Trasteos y mudanzas de barrio con camión, furgón y ayudantes. Haz un inventario simple y compártelo para que la cotización sea realista." },
      { nombre: "Fletes y acarreos pequeños", slug: "fletes", principal: "fletes en Bogotá", relacionadas: ["fletes baratos", "acarreos pequeños", "carry", "camioneta", "moto carga", "llevar un mueble", "transporte de electrodomésticos"], problemas: ["Llevar un mueble", "Electrodomésticos", "Carga pequeña"], intro: "Fletes y acarreos pequeños de carga: muebles, electrodomésticos y paquetes grandes, en carry, camioneta o moto de carga. Solo transportan carga." },
      { nombre: "Retiro de escombros y trastos viejos", slug: "retiro-de-escombros", rut: true, principal: "retiro de escombros en Bogotá", relacionadas: ["botar colchón", "sacar muebles viejos", "trastos", "volqueta", "recolección de voluminosos"], problemas: ["Botar un colchón", "Sacar muebles viejos", "Escombros de obra"], intro: "Retiro de escombros, colchones y muebles viejos con disposición adecuada. Aparecen con RUT verificado." },
      { nombre: "Embalaje y guardamuebles", slug: "embalaje-y-guardamuebles", principal: "embalaje y guardamuebles en Bogotá", relacionadas: ["empacar", "cajas de trasteo", "bodega", "almacenamiento temporal"], problemas: ["Empacar para un trasteo", "Cajas", "Bodega temporal"], intro: "Embalaje de menaje y almacenamiento temporal en bodegas para tu mudanza." },
    ],
  }),
  padre({
    nombre: "Servicios varios",
    icono: "herramienta",
    corto: "Costura, mascotas, belleza",
    descripcion: "Tecnología, belleza, mascotas, costura y más",
    oficios: [
      { nombre: "Tecnología", slug: "tecnico-de-computadores", detalle: "Computadores, wifi, celulares", principal: "técnico de computadores en Bogotá", relacionadas: ["arreglo de computadores", "formatear", "wifi", "celulares"], problemas: ["Formatear", "Wifi lento", "Computador lento", "Celular dañado"], intro: "Técnicos para arreglar computadores, redes wifi y celulares en tu casa u oficina." },
      { nombre: "Belleza a domicilio", slug: "belleza-a-domicilio", principal: "manicurista a domicilio en Bogotá", relacionadas: ["uñas", "peluquero a domicilio", "barbero a domicilio", "maquillaje"], problemas: ["Manicure y pedicure", "Peluquería", "Barbero", "Maquillaje"], intro: "Manicure, peluquería, barbería y maquillaje a domicilio, sin salir de casa." },
      { nombre: "Costura", slug: "costurera", principal: "arreglos de ropa en Bogotá", relacionadas: ["costurera", "modista", "sastre", "ruedos", "cremalleras"], problemas: ["Ruedos", "Cremalleras", "Ajustes de talla"], intro: "Arreglos de ropa: ruedos, cremalleras y ajustes de talla con costureras y modistas." },
      { nombre: "Fotografía", slug: "fotografo", principal: "fotógrafo a domicilio en Bogotá", relacionadas: ["sesión de fotos", "retratos", "fotografía de eventos"], problemas: ["Sesión de fotos", "Retratos", "Eventos"], intro: "Fotógrafos para sesiones, retratos y eventos. Revisa los portafolios antes de escribirles." },
      { nombre: "Planchado", slug: "planchado", principal: "planchado de ropa a domicilio en Bogotá", relacionadas: ["planchadora", "ropa por docenas"], problemas: ["Ropa por docenas", "Camisas"], intro: "Planchado de ropa por docenas, con recogida y entrega según el proveedor." },
      { nombre: "Reparación de calzado", slug: "zapatero", principal: "reparación de calzado en Bogotá", relacionadas: ["zapatero", "suelas", "tacones", "marroquinería"], problemas: ["Suelas", "Tacones", "Marroquinería"], intro: "Zapateros para cambio de suelas, tacones y arreglos de marroquinería." },
      { nombre: "Lavado de carros a domicilio", slug: "lavado-de-carros", principal: "lavado de carros a domicilio en Bogotá", relacionadas: ["lavado de motos", "brillado", "polichado"], problemas: ["Lavado de carro", "Lavado de moto", "Polichado"], intro: "Lavado y brillado de carros y motos en tu parqueadero o en la puerta de tu casa." },
      { nombre: "Cocina a domicilio", slug: "cocina-a-domicilio", principal: "cocinera a domicilio en Bogotá", relacionadas: ["chef a domicilio", "almuerzos", "comida para eventos", "repostería"], problemas: ["Almuerzos", "Comida para eventos", "Repostería"], intro: "Cocineras y chefs que preparan almuerzos, comida para eventos y repostería." },
      { nombre: "Eventos", slug: "eventos", detalle: "Meseros, decoración", principal: "meseros y decoración para eventos en Bogotá", relacionadas: ["globos", "mesa de dulces", "montaje de eventos", "fiestas"], problemas: ["Meseros", "Decoración con globos", "Mesa de dulces"], intro: "Meseros, decoración y montaje para fiestas y eventos en casa." },
      { nombre: "Entrenador personal", slug: "entrenador-personal", detalle: "Yoga, pilates, rutinas", principal: "entrenador personal a domicilio en Bogotá", relacionadas: ["gimnasio en casa", "yoga a domicilio", "yoga", "pilates", "rutinas de ejercicio", "acondicionamiento físico"], problemas: ["Yoga", "Pilates", "Rutinas de ejercicio", "Acondicionamiento físico"], intro: "Entrenadores para yoga, pilates, rutinas y acondicionamiento físico en tu casa. Son clases de ejercicio, no atención de salud." },
      { nombre: "Recreacionistas", slug: "recreacionistas", menores: true, principal: "recreacionistas para fiestas infantiles en Bogotá", relacionadas: ["show infantil", "payasos", "magos", "juegos"], problemas: ["Show infantil", "Payasos", "Juegos y dinámicas"], intro: "Recreacionistas para fiestas infantiles: shows, juegos y dinámicas. Quienes trabajan con menores tienen verificación de antecedentes." },
    ],
  }),
  padre({
    nombre: "Mascotas y veterinaria",
    icono: "huella",
    corto: "Veterinarios, paseos, peluquería",
    descripcion: "Veterinarios, paseadores, peluquería canina y guardería",
    oficios: [
      { nombre: "Veterinarios", slug: "veterinario", popular: true, urgencias: true, matricula: true, detalle: "Consulta, vacunas, urgencias 24 horas", principal: "veterinario en Bogotá", relacionadas: ["veterinario a domicilio", "veterinario 24 horas", "urgencias veterinarias", "clínica veterinaria", "vacunas para perros", "vacunas para gatos", "desparasitación", "esterilización", "consulta veterinaria", "médico veterinario"], problemas: ["Vacunas", "Consulta a domicilio", "Urgencia veterinaria", "Desparasitación", "Esterilización"], intro: "Médicos veterinarios para consulta, vacunas y urgencias de perros, gatos y otras mascotas. Algunos declaran atender urgencias o las 24 horas: míralo en sus etiquetas y confirma la disponibilidad por WhatsApp. Pedimos la tarjeta profesional o matrícula antes de aprobar el perfil. LasTresB no presta el servicio ni garantiza tiempos de llegada." },
      { nombre: "Paseo de perros", slug: "paseador-de-perros", popular: true, principal: "paseador de perros en Bogotá", relacionadas: ["paseo de perros", "paseador", "caminata para perros"], problemas: ["Paseo diario", "Paseo ocasional", "Perros grandes"], intro: "Paseadores de perros para el día a día o para cuando no estás. Antes de empezar, conoce a la persona y acuerda horarios, rutas y qué hacer ante cualquier imprevisto." },
      { nombre: "Peluquería canina", slug: "peluqueria-canina", principal: "peluquería canina en Bogotá", relacionadas: ["baño de perros", "corte de pelo para perros", "estética canina", "peluquería de mascotas a domicilio", "grooming"], problemas: ["Baño y corte", "Estética canina", "A domicilio"], intro: "Baño, corte y estética para perros y gatos, en el local o en tu casa. Cuéntale al peluquero la raza, el tamaño y si tu mascota es nerviosa." },
      { nombre: "Adiestramiento canino", slug: "adiestrador-canino", principal: "adiestrador de perros en Bogotá", relacionadas: ["entrenador de perros", "educación canina", "cachorros", "obediencia", "corrección de conducta"], problemas: ["Cachorros", "Obediencia", "Conducta"], intro: "Adiestradores para enseñar obediencia a cachorros y perros adultos. Pregunta por el método que usan y pide ver su trabajo con otros perros." },
      { nombre: "Guardería y hotel para mascotas", slug: "guarderia-de-mascotas", principal: "guardería de perros en Bogotá", relacionadas: ["hotel para perros", "hospedaje de mascotas", "pensión para mascotas", "cuidado de mascotas en vacaciones"], problemas: ["Vacaciones", "Fines de semana", "Guardería por días"], intro: "Guardería y hospedaje para tu mascota cuando viajas o trabajas todo el día. Visita el lugar, pregunta por las vacunas que exigen y cómo te avisan cómo va tu mascota." },
    ],
  }),
  padre({
    nombre: "Servicios profesionales",
    icono: "maletin",
    corto: "Contadores, arquitectos, diseño",
    descripcion: "Contadores, arquitectos, diseño gráfico y traducciones",
    oficios: [
      { nombre: "Contadores y administradores de empresas", slug: "contador", detalle: "Contabilidad, impuestos, trámites", matricula: true, principal: "contador en Bogotá", relacionadas: ["contador público", "contabilidad", "declaración de renta", "RUT", "facturación electrónica", "impuestos", "administrador de empresas", "asesoría contable", "balances", "contador para independientes"], problemas: ["Declaración de renta", "Contabilidad de mi negocio", "RUT y facturación electrónica", "Asesoría para independientes"], intro: "Contadores y administradores de empresas para trabajos puntuales: declaración de renta, contabilidad de tu negocio, RUT y facturación electrónica. Es un oficio de recomendación de voz a voz: revisa las reseñas, pide la cotización por escrito y acuerda el alcance del trabajo antes de empezar. Pedimos la tarjeta profesional o matrícula del oficio antes de aprobar el perfil." },
      { nombre: "Arquitectos y diseño de interiores", slug: "arquitecto", matricula: true, detalle: "Planos, diseño, licencias", principal: "arquitecto en Bogotá", relacionadas: ["diseño de interiores", "planos", "remodelación de apartamento", "licencia de construcción", "decoración", "renders"], problemas: ["Planos", "Diseño de interiores", "Remodelación", "Licencias de construcción"], intro: "Arquitectos y diseñadores de interiores para planos, remodelaciones y decoración. Pedimos la matrícula profesional antes de aprobar el perfil. Pide una propuesta por escrito con el alcance, los entregables y los tiempos." },
      { nombre: "Diseño gráfico y marketing", slug: "diseno-grafico", principal: "diseñador gráfico en Bogotá", relacionadas: ["logos", "diseño de logo", "redes sociales", "community manager", "flyers", "páginas web", "marketing digital", "branding"], problemas: ["Logo", "Redes sociales", "Página web", "Piezas para tu negocio"], intro: "Diseñadores y creadores de contenido para tu logo, tus redes sociales, tu página web y las piezas de tu negocio. Revisa sus portafolios y acuerda por escrito qué entrega y cuántos ajustes incluye." },
      { nombre: "Traducciones", slug: "traductor", principal: "traductor en Bogotá", relacionadas: ["traducción de documentos", "traductor de inglés", "traducción oficial", "intérprete", "subtítulos"], problemas: ["Documentos", "Inglés", "Traducción oficial", "Subtítulos"], intro: "Traductores de documentos, textos y subtítulos. Si necesitas una traducción oficial para un trámite, confirma con el traductor y con la entidad que la pide qué requisitos debe cumplir." },
    ],
  }),];

export const categoriaPorSlug = (slug: string) => CATEGORIAS.find((c) => c.slug === slug);

/** Oficio (subcategoría) con su categoría padre, por slug de oficio. */
export function subcategoriaPorSlug(slug: string) {
  for (const padre of CATEGORIAS) {
    const sub = padre.subcategorias.find((s) => s.slug === slug);
    if (sub) return { sub, padre };
  }
  return undefined;
}

export const TODAS_LAS_SUBCATEGORIAS = CATEGORIAS.flatMap((padre) => padre.subcategorias.map((sub) => ({ sub, padre })));

/** Oficios de los que más se busca: «Lo más buscado» en /categorias. */
export const OFICIOS_POPULARES = TODAS_LAS_SUBCATEGORIAS.filter(({ sub }) => sub.popular);

/** Slugs anteriores que hoy se redirigen (301) al oficio vigente. */
export const OFICIOS_RENOMBRADOS: Record<string, string> = {
  plomeria: "plomero",
  electricidad: "electricista",
  gas: "tecnico-de-gas",
  electrodomesticos: "tecnico-de-neveras",
  "instalaciones-y-montajes": "todero",
  "pintura-y-acabados": "pintor",
  "construccion-y-remodelacion": "maestro-de-obra",
  "techos-e-impermeabilizacion": "impermeabilizacion",
  "vidrios-y-venteneria": "vidriero",
  "vidrios-y-ventaneria": "vidriero",
  "soldadura-y-ornamentacion": "ornamentador",
  carpinteria: "carpintero",
  cerrajeria: "cerrajero",
  seguridad: "instalador-de-camaras",
  "aseo-y-limpieza": "aseo",
  fumigacion: "fumigador",
  jardineria: "jardinero",
  "refuerzo-escolar": "profesor-particular",
  "matematicas-y-ciencias": "clases-de-matematicas",
  idiomas: "profesor-de-ingles",
  musica: "clases-de-musica",
  "trasteos-y-mudanzas": "trasteos",
  tecnologia: "tecnico-de-computadores",
  costura: "costurera",
  mascotas: "paseador-de-perros",
};

/** Oficios eliminados por la regla de negocio: sus URLs se redirigen a /categorias. */
export const OFICIOS_ELIMINADOS = ["cuidado-de-personas"];

/**
 * Regla de negocio: transporte de personas y servicios de salud o cuidado de personas no se ofrecen.
 * Sirve para filtrar solicitudes de usuarios y para vigilar que nunca existan en los datos.
 */
const PROHIBIDOS = /(conductor|chofer|chófer|taxi|mototaxi|pasajer|ni[ñn]er[oa]|cuidador|cuidado de personas|enfermer|adultos? mayor|terap(ia|eut)|masaje terap|fisioterap|dislexia)/i;
export const contieneServicioProhibido = (texto: string) => PROHIBIDOS.test(texto);
