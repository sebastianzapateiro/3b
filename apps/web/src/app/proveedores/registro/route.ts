/**
 * P3 · Alta de proveedor (CU-30). Ya no hay asistente: crea el borrador y lleva al panel, donde se completan
 * las tareas pendientes y se envía a revisión. El proxy ya exigió sesión y consentimiento.
 * Los enlaces a esta ruta van con prefetch={false}: un GET aquí crea el borrador.
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { crearBorrador } from "@/lib/alta-proveedor";
import { redirigir } from "@/lib/redireccion";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion?.user) return redirigir(request, `/ingreso?${new URLSearchParams({ destino: "/proveedores/registro" })}`);
  await crearBorrador(sesion.user);
  return redirigir(request, "/panel?bienvenida=1");
}
