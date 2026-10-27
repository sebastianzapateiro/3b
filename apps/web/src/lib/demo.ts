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
    servicio: "Acarreos",
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
