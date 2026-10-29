/**
 * Datos de ejemplo para la home mientras no hay proveedores aprobados.
 * Reemplazar por la consulta de recomendados por localidad (P2) cuando exista.
 */
export type Insignia = "verificado" | "formalizado" | "apto_menores" | "certificado";

export type ProveedorResumen = {
  slug: string;
  nombre: string;
  iniciales: string;
  servicio: string;
  localidades: string[];
  promedio: number;
  totalResenas: number;
  insignias: Insignia[];
  precioDesde?: number;
  tono: "verde" | "amarillo" | "ladrillo";
};

export const RECOMENDADOS_DEMO: ProveedorResumen[] = [
  {
    slug: "jairo-rodriguez-plomeria",
    nombre: "Jairo Rodríguez",
    iniciales: "JR",
    servicio: "Plomería",
    localidades: ["Suba", "Usaquén"],
    promedio: 4.8,
    totalResenas: 37,
    insignias: ["verificado", "formalizado"],
    precioDesde: 60000,
    tono: "verde",
  },
  {
    slug: "laura-mendoza-ingles",
    nombre: "Laura Mendoza",
    iniciales: "LM",
    servicio: "Clases de inglés",
    localidades: ["Suba", "Chapinero"],
    promedio: 4.9,
    totalResenas: 52,
    insignias: ["verificado", "apto_menores"],
    tono: "amarillo",
  },
  {
    slug: "carlos-pinzon-acarreos",
    nombre: "Carlos Pinzón",
    iniciales: "CP",
    servicio: "Trasteos y mudanzas",
    localidades: ["Suba", "Engativá"],
    promedio: 4.7,
    totalResenas: 24,
    insignias: ["verificado"],
    precioDesde: 90000,
    tono: "ladrillo",
  },
];

export const RESENA_DESTACADA_DEMO = {
  proveedor: RECOMENDADOS_DEMO[0]!,
  texto: "Llegó a la hora que dijo, arregló la fuga del lavaplatos y me dejó todo limpio. Cobró lo que acordamos.",
  cliente: "Marcela G.",
  localidad: "Suba",
};

/**
 * Perfil completo de muestra para los proveedores demo (/[slug]). Datos ilustrativos, no reales;
 * la página los marca como «Perfil de ejemplo» y no se indexa.
 */
const SERVICIOS_DEMO: Record<string, { nombre: string; descripcion: string; precioDesde: string; unidad: string }[]> = {
  "Plomería": [
    { nombre: "Visita de diagnóstico", descripcion: "Incluye revisión de fugas", precioDesde: "60000", unidad: "visita" },
    { nombre: "Destape de cañería", descripcion: "", precioDesde: "90000", unidad: "trabajo" },
    { nombre: "Cambio de grifería", descripcion: "", precioDesde: "80000", unidad: "trabajo" },
  ],
  "Clases de inglés": [
    { nombre: "Clase individual", descripcion: "Presencial o virtual", precioDesde: "45000", unidad: "clase" },
    { nombre: "Preparación de examen", descripcion: "TOEFL / IELTS", precioDesde: "60000", unidad: "clase" },
  ],
  "Trasteos y mudanzas": [
    { nombre: "Trasteo pequeño", descripcion: "Dentro de la misma localidad", precioDesde: "90000", unidad: "trayecto" },
    { nombre: "Objetos pesados", descripcion: "Neveras, lavadoras, muebles", precioDesde: "70000", unidad: "trayecto" },
  ],
};

export function perfilDemo(slug: string): import("@/lib/portafolio-completo").PortafolioCompleto | undefined {
  const p = RECOMENDADOS_DEMO.find((x) => x.slug === slug);
  if (!p) return undefined;
  const ahora = Date.now();
  const dia = 86_400_000;
  return {
    slug: p.slug,
    nombre: p.nombre,
    presentacion: "Perfil de ejemplo para mostrar cómo se ve un portafolio en LasTresB. Aquí cada proveedor cuenta, en sus propias palabras, su experiencia y cómo trabaja.",
    whatsapp: "",
    categoriaPrincipal: p.servicio,
    localidadPrincipal: p.localidades[0] ?? null,
    servicios: SERVICIOS_DEMO[p.servicio] ?? [],
    fotos: [],
    insignias: p.insignias.map((clave) => ({ clave, nombre: { verificado: "Verificado", formalizado: "Formalizado", apto_menores: "Apto para menores", certificado: "Certificado" }[clave] })),
    resenas: [
      { id: "demo-1", nombreCliente: "Marcela G.", estrellas: 5, comentario: "Llegó a la hora que dijo y cobró lo que acordamos.", creadoEn: new Date(ahora - 14 * dia), respuesta: null },
      { id: "demo-2", nombreCliente: "Andrés P.", estrellas: 4, comentario: "Buen trabajo y muy amable. Demoró un poco en empezar.", creadoEn: new Date(ahora - 40 * dia), respuesta: null },
    ],
    promedio: p.promedio,
    totalResenas: p.totalResenas,
    categorias: [p.servicio],
    localidades: p.localidades,
    desde: new Date(ahora - 200 * dia),
    distribucion: [0, 1, 2, 8, 26].map((n) => n),
    enlaces: [],
    esEjemplo: true,
  };
}
