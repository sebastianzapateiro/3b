/**
 * P2 · Datos de muestra SOLO para ver el diseño de las tarjetas de /proveedores en desarrollo (`/proveedores?demo=1`).
 * No toca la base (en local es la de producción) y no se activa en producción. No son proveedores reales.
 */
import type { NivelPerfil } from "@/lib/demo";
import type { ResultadoBusqueda, ResultadoServicio } from "@/lib/busqueda";

const NIVELES: NivelPerfil[] = ["verificado", "completo", "destacado"];
const nivelDe = (n: number): NivelPerfil => NIVELES[n % 3] ?? "completo";
const de = (lista: readonly string[], n: number) => lista[n % lista.length] ?? "";

const MUESTRA = [
  { oficio: "Plomería", servicio: "Reparación de fugas", detalle: "Incluye revisión de tuberías y llaves", precio: 60000, unidad: "visita" },
  { oficio: "Electricidad", servicio: "Instalación de tomacorrientes", detalle: "Certificada, con garantía de 3 meses", precio: 45000, unidad: "trabajo" },
  { oficio: "Aseo y limpieza", servicio: "Lavado de muebles", detalle: "Limpieza, desinfección y desodorización", precio: null, unidad: "trabajo" },
  { oficio: "Pisos", servicio: "Piso laminado", detalle: "Decapado y brillado", precio: 10000, unidad: "metro2" },
  { oficio: "Idiomas", servicio: "Clases de inglés", detalle: "Para niños y adultos, virtual o presencial", precio: 100000, unidad: "clase" },
  { oficio: "Construcción y remodelación", servicio: "Obra en casa", detalle: null, precio: null, unidad: "trabajo" },
  { oficio: "Pintura", servicio: "Pintura de apartamento", detalle: "Estuco, vinilo y acabados", precio: 25000, unidad: "metro2" },
  { oficio: "Transporte y mudanzas", servicio: "Mudanza dentro de Bogotá", detalle: "Camión, ayudantes y embalaje", precio: 180000, unidad: "trayecto" },
] as const;

const NOMBRES = ["Rubén Mantenimientos", "Sergio Zapata El Traductor", "Fabio Medina Arreglos", "Lucía Hogar Limpio", "Hernán Eléctricos", "Camila Pinturas", "Andrés Mudanzas Bogotá", "Doña Marta Aseo"];
const ZONAS = ["Suba", "Chapinero", "Usaquén", "Kennedy", "Teusaquillo", "Engativá", "Fontibón", "Barrios Unidos"];

export function servicioDemo(n: number): ResultadoServicio {
  const m = MUESTRA[n % MUESTRA.length]!;
  const slug = `demo-${n % NOMBRES.length}`;
  return {
    id: -(n + 1), nombre: m.servicio, descripcion: m.detalle, oficio: m.oficio, precioDesde: m.precio, unidad: m.unidad,
    proveedor: { slug, nombre: de(NOMBRES, n), nivel: nivelDe(n), fotoPerfil: null },
  };
}

export function proveedorDemo(n: number): ResultadoBusqueda {
  const m = MUESTRA[n % MUESTRA.length]!;
  return {
    slug: `demo-${n % NOMBRES.length}`, nombre: de(NOMBRES, n),
    servicios: [m.oficio, MUESTRA[(n + 3) % MUESTRA.length]!.oficio].slice(0, n % 3 === 0 ? 1 : 2),
    localidades: [de(ZONAS, n), de(ZONAS, n + 2)],
    promedio: 4.2 + (n % 8) / 10, totalResenas: (n * 3) % 17, nivel: nivelDe(n),
    insignias: n % 2 === 0 ? [{ clave: "verificado", nombre: "Identidad verificada" }] : [],
    precioDesde: m.precio, atiendeUrgencias: n % 4 === 0, disponible24h: n % 5 === 0,
    precioVisita: m.unidad === "visita" ? m.precio : null, visitaAConvenir: n % 3 === 1, fotoPerfil: null,
  };
}

/** Los primeros `mostrar` de 30 elementos de muestra. */
export const TOTAL_DEMO = 30;
export const serviciosDemo = (mostrar: number) => Array.from({ length: Math.min(mostrar, TOTAL_DEMO) }, (_, i) => servicioDemo(i));
export const proveedoresDemo = (mostrar: number) => Array.from({ length: Math.min(mostrar, TOTAL_DEMO) }, (_, i) => proveedorDemo(i));
