import { SubMenu } from "@/components/SubMenu";
import { exigirProveedor } from "@/lib/panel";

export const metadata = { title: "Panel de proveedor", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ESTADO: Record<string, { texto: string; clase: string }> = {
  borrador: { texto: "Borrador", clase: "bg-piedra text-tinta-2" },
  pendiente: { texto: "En revisión del equipo", clase: "bg-amarillo-suave text-amarillo-oscuro" },
  en_revision: { texto: "Visible · en observación", clase: "bg-amarillo-suave text-amarillo-oscuro" },
  aprobado: { texto: "Publicado", clase: "bg-verde-claro text-verde-oscuro" },
  rechazado: { texto: "Necesita correcciones", clase: "bg-ladrillo-suave text-ladrillo-oscuro" },
  pausado: { texto: "En pausa", clase: "bg-piedra text-tinta-2" },
  pausado_por_rut: { texto: "Pausado: falta el RUT", clase: "bg-ladrillo-suave text-ladrillo-oscuro" },
  suspendido: { texto: "Suspendido", clase: "bg-ladrillo-suave text-ladrillo-oscuro" },
};

/** P8 · Panel del proveedor. Mockup: docs/mockups/Panel_proveedor.md. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { proveedor } = await exigirProveedor();
  const estado = ESTADO[proveedor.estado] ?? ESTADO.borrador!;

  return (
    <main className="mx-auto flex max-w-[1000px] flex-col gap-5 px-5 pb-14 pt-4 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-4xl">{proveedor.nombre}</h1>
          <span className="font-mono text-sm text-gris">lastresb.com.co/{proveedor.slug}</span>
        </div>
        <span className={`flex h-8 items-center rounded-2xl px-3.5 text-sm font-semibold ${estado.clase}`}>{estado.texto}</span>
      </div>
      <SubMenu
        etiqueta="Panel de proveedor"
        items={[
          { href: "/panel", texto: "Resumen" },
          { href: "/panel/perfil", texto: "Perfil" },
          { href: "/panel/servicios", texto: "Servicios" },
          { href: "/panel/resenas", texto: "Reseñas" },
          { href: "/panel/verificacion", texto: "Verificación" },
        ]}
      />
      {children}
    </main>
  );
}
