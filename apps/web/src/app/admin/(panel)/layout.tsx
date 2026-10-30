import { ContenidoPanel } from "@/components/admin/ContenidoPanel";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { contadoresMenu } from "@/lib/admin";
import { exigirBackoffice } from "@/lib/verificacion";

export const metadata = { title: "Backoffice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Marco del backoffice: exige sesión + rol + 2FA en cada página del panel y pinta el menú lateral. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // En paralelo: los contadores no muestran nada si el guardia redirige.
  const [{ user, rol, roles }, { pendientes, reportes, tramites }] = await Promise.all([exigirBackoffice(), contadoresMenu()]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F3EFE7] lg:flex-row">
      <MenuAdmin nombre={user.name} rol={rol} pendientes={pendientes} reportes={reportes} tramites={tramites} esAdmin={roles.includes("admin")} />
      <ContenidoPanel>{children}</ContenidoPanel>
    </div>
  );
}
