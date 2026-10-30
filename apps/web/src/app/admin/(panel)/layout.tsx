import { ContenidoPanel } from "@/components/admin/ContenidoPanel";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { totalPendientes } from "@/lib/admin";
import { contarAbiertos } from "@/lib/cumplimiento";
import { totalReportesPendientes } from "@/lib/moderacion";
import { exigirBackoffice } from "@/lib/verificacion";

export const metadata = { title: "Backoffice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Marco del backoffice: exige sesión + rol + 2FA en cada página del panel y pinta el menú lateral. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, rol, roles } = await exigirBackoffice();
  const [pendientes, reportes, tramites] = await Promise.all([totalPendientes(), totalReportesPendientes().catch(() => 0), contarAbiertos().catch(() => 0)]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#F3EFE7] lg:flex-row">
      <MenuAdmin nombre={user.name} rol={rol} pendientes={pendientes} reportes={reportes} tramites={tramites} esAdmin={roles.includes("admin")} />
      <ContenidoPanel>{children}</ContenidoPanel>
    </div>
  );
}
