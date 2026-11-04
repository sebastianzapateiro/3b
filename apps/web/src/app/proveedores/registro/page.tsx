/**
 * P3 · Alta de proveedor (CU-30). Ya no hay asistente: crea el borrador y lleva al panel, donde se completan
 * las tareas pendientes y se envía a revisión. El proxy ya exigió sesión y consentimiento.
 * Es una página (no un route handler) para que `redirect()` funcione también cuando se llega por navegación
 * del cliente: desde la Server Action de /ingreso/listo, un `Link` o `router.push`. Con un route handler el
 * navegador se quedaba en esta URL sin llegar al panel. Los enlaces van con prefetch={false}: visitarla crea el borrador.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { crearBorrador } from "@/lib/alta-proveedor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registro de proveedor", robots: { index: false, follow: false } };

export default async function RegistroProveedor() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion?.user) redirect(`/ingreso?${new URLSearchParams({ destino: "/proveedores/registro" })}`);
  await crearBorrador(sesion.user);
  redirect("/panel?bienvenida=1");
}
