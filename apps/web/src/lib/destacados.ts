/**
 * P1 · Perfiles del Home (CU-01): los primeros proveedores visibles (`aprobado` o `en_revision`, regla 6) como tarjetas de proveedor.
 * Usa la misma búsqueda de /proveedores, sin datos privados (regla 1). Para la web pública.
 */
import { buscarProveedores } from "@/lib/busqueda";
import type { Insignia, ProveedorResumen } from "@/lib/demo";

const INSIGNIAS: readonly string[] = ["verificado", "formalizado", "apto_menores", "certificado"];
const TONOS = ["verde", "amarillo", "ladrillo"] as const;

export async function proveedoresDestacados(cantidad = 3): Promise<ProveedorResumen[]> {
  const { items } = await buscarProveedores({ pagina: 1 });
  return items.slice(0, cantidad).map((p, i) => ({
    nivel: p.nivel,
    slug: p.slug,
    nombre: p.nombre,
    iniciales: p.nombre.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2),
    servicio: p.servicios[0] ?? "Servicios",
    localidades: p.localidades.slice(0, 2),
    promedio: p.promedio,
    totalResenas: p.totalResenas,
    insignias: p.insignias.map((x) => x.clave).filter((c): c is Insignia => INSIGNIAS.includes(c)),
    precioDesde: p.precioDesde ?? undefined,
    tono: TONOS[i % TONOS.length]!,
  }));
}
