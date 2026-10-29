/** P2 · Conteo en vivo del panel de filtros («Ver N proveedores»). Público, solo devuelve un número. */
import { contarProveedores, filtrosDesdeParams } from "@/lib/busqueda";

export async function GET(req: Request) {
  const total = await contarProveedores(filtrosDesdeParams(new URL(req.url).searchParams));
  return Response.json({ total });
}
