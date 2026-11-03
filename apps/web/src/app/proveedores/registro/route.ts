/**
 * P3 · Alta de proveedor (CU-30). Ya no hay asistente: crea el borrador y lleva al panel, donde se completan
 * las tareas pendientes y se envía a revisión. El proxy ya exigió sesión y consentimiento.
 * Los enlaces a esta ruta van con prefetch={false}: un GET aquí crea el borrador.
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { crearBorrador } from "@/lib/alta-proveedor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion?.user) return NextResponse.redirect(new URL(`/ingreso?${new URLSearchParams({ destino: "/proveedores/registro" })}`, request.url));
  await crearBorrador(sesion.user);
  return NextResponse.redirect(new URL("/panel?bienvenida=1", request.url));
}
