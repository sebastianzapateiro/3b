import { sugerirSlug } from "./slug";

/**
 * Taxonomía de categorías (P2, CU-03). Fuente única: la leen la semilla de la base,
 * el Home y /categorias. Fuente de negocio: casos de uso, sección 5.7.
 */
export type Subcategoria = {
  nombre: string;
  slug: string;
  /** Texto corto que aclara qué incluye (opcional). */
  detalle?: string;
  /** Palabras clave y sinónimos para la búsqueda (terminos_busqueda). */
  claves: string;
  exigeInsigniaMenores: boolean;
  exigeRutDesdeAlta: boolean;
};

export type CategoriaPadre = {
  nombre: string;
  slug: string;
  /** Clave del ícono guardada en `categorias.icono`. */
  icono: "casa" | "libro" | "camion" | "herramienta";
  /** Frase corta para la tarjeta del Home en móvil. */
  corto: string;
  /** Resumen para la tarjeta del Home y la descripción de /categorias/[slug]. */
  descripcion: string;
  subcategorias: Subcategoria[];
};

type SubFuente = { nombre: string; claves: string; detalle?: string; menores?: boolean; rut?: boolean };

function sub(s: SubFuente): Subcategoria {
  return {
    nombre: s.nombre,
    slug: sugerirSlug(s.nombre),
    detalle: s.detalle,
    claves: s.claves,
    exigeInsigniaMenores: s.menores ?? false,
    exigeRutDesdeAlta: s.rut ?? false,
  };
}

function padre(p: Omit<CategoriaPadre, "slug" | "subcategorias"> & { subs: SubFuente[] }): CategoriaPadre {
  const { subs, ...resto } = p;
  return { ...resto, slug: sugerirSlug(p.nombre), subcategorias: subs.map(sub) };
}

export const CATEGORIAS: CategoriaPadre[] = [
  padre({
    nombre: "Hogar",
    icono: "casa",
    corto: "Plomería, luz, pintura",
    descripcion: "Plomería, electricidad, pintura, cerrajería",
    subs: [
      { nombre: "Plomería", claves: "plomero, fontanero, tubería, cañería, destape, fuga, goteo, sanitario, inodoro, lavaplatos, grifería, llave, lavado de tanques" },
      { nombre: "Electricidad", claves: "electricista, corto, cortocircuito, toma, enchufe, tacos, breaker, cableado, lámparas, instalación eléctrica", rut: true },
      { nombre: "Gas", claves: "gasodomésticos, instalación de gas, calentador a gas, estufa a gas, fuga de gas", rut: true },
      { nombre: "Electrodomésticos", detalle: "Neveras, lavadoras, estufas, aire acondicionado", claves: "técnico de neveras, nevera, nevecón, congelador, lavadora, secadora, centro de lavado, estufa, horno, microondas, campana extractora, lavavajillas, calentador, aire acondicionado" },
      { nombre: "Instalaciones y montajes", detalle: "Taladro, cuadros, repisas, soporte de TV, armar muebles", claves: "taladro, perforar, colgar cuadros, repisas, soporte de TV, cortinas, persianas, instalar lámparas, armar muebles, instalar electrodomésticos" },
      { nombre: "Pintura y acabados", claves: "pintor, pintar, estuco, resane, fachada, drywall, cielo raso" },
      { nombre: "Construcción y remodelación", claves: "maestro de obra, albañil, enchape, baldosa, piso, remodelación, cocina integral", rut: true },
      { nombre: "Techos e impermeabilización", claves: "goteras, tejas, canales, impermeabilizar, humedad, filtraciones", rut: true },
      { nombre: "Vidrios y ventanería", claves: "vidriero, vidrio, ventana, espejo, división de baño, ventanal" },
      { nombre: "Soldadura y ornamentación", claves: "soldador, rejas, puertas metálicas, pasamanos, estructuras", rut: true },
      { nombre: "Carpintería", claves: "carpintero, ebanista, muebles, clóset, puertas, cocina" },
      { nombre: "Cerrajería", claves: "cerrajero, chapa, cerradura, llaves, abrir puerta, guarda" },
      { nombre: "Seguridad", detalle: "Cámaras, citófono, alarmas", claves: "cámaras de seguridad, citófono, alarma, cerca eléctrica, CCTV" },
      { nombre: "Aseo y limpieza", claves: "aseo, limpieza, empleada por días, lavado de muebles, tapicería, alfombras, colchones" },
      { nombre: "Fumigación", claves: "fumigar, cucarachas, ratones, roedores, termitas, plagas", rut: true },
      { nombre: "Jardinería", claves: "jardinero, poda, césped, pasto, plantas" },
    ],
  }),
  padre({
    nombre: "Clases y refuerzo",
    icono: "libro",
    corto: "Inglés, mate, música",
    descripcion: "Matemáticas, inglés, música, tareas",
    subs: [
      { nombre: "Refuerzo escolar", claves: "tareas, nivelación, profesor particular, tutor, primaria, bachillerato", menores: true },
      { nombre: "Matemáticas y ciencias", claves: "álgebra, cálculo, física, química", menores: true },
      { nombre: "Idiomas", claves: "inglés, francés, conversación, TOEFL, IELTS", menores: true },
      { nombre: "Preicfes", claves: "ICFES, Saber 11, preuniversitario", menores: true },
      { nombre: "Música", claves: "guitarra, piano, canto, violín, batería", menores: true },
    ],
  }),
  padre({
    nombre: "Acarreos",
    icono: "camion",
    corto: "Mudanzas de barrio",
    descripcion: "Mudanzas de barrio, objetos pesados",
    subs: [
      { nombre: "Trasteos y mudanzas", detalle: "Mudanzas de barrio, objetos pesados", claves: "trasteo, mudanza, acarreo, camión, furgón, flete, carga, embalaje" },
    ],
  }),
  padre({
    nombre: "Servicios varios",
    icono: "herramienta",
    corto: "Costura, mascotas, belleza",
    descripcion: "Tecnología, belleza, mascotas, costura, cuidado de personas",
    subs: [
      { nombre: "Tecnología", detalle: "Computadores, wifi, celulares", claves: "técnico de computadores, formatear, wifi, redes, impresora, celular" },
      { nombre: "Belleza a domicilio", claves: "manicure, pedicure, peluquería, barbero, uñas, maquillaje" },
      { nombre: "Mascotas", claves: "paseador de perros, peluquería canina, adiestrador, guardería" },
      { nombre: "Costura", claves: "modista, costurera, arreglos de ropa, ruedos, bordado, confección" },
      { nombre: "Cuidado de personas", claves: "niñera, cuidadora, enfermera a domicilio, adulto mayor", menores: true, rut: true },
    ],
  }),
];

export const categoriaPorSlug = (slug: string) => CATEGORIAS.find((c) => c.slug === slug);

/** Subcategoría con su categoría padre, por slug (páginas /servicios/[sub]). */
export function subcategoriaPorSlug(slug: string) {
  for (const padre of CATEGORIAS) {
    const sub = padre.subcategorias.find((s) => s.slug === slug);
    if (sub) return { sub, padre };
  }
  return undefined;
}

export const TODAS_LAS_SUBCATEGORIAS = CATEGORIAS.flatMap((padre) => padre.subcategorias.map((sub) => ({ sub, padre })));
