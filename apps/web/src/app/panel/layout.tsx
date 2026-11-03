import Link from "next/link";
import { GuiaAlta } from "@/components/panel/GuiaAlta";
import { MenuProveedor, type MarcaSeccion } from "@/components/panel/MenuProveedor";
import { pendientesAlta, type SeccionPanel } from "@/lib/alta-proveedor";
import { exigirProveedor, resumenPanel } from "@/lib/panel";

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

/**
 * P8 · Marco del panel del proveedor, con el lenguaje del backoffice: menú lateral con el avance del perfil
 * y, mientras es borrador, la guía del siguiente paso del alta (CU-30). Mockup: docs/mockups/Panel_proveedor.md.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { proveedor: p } = await exigirProveedor();
  const [alta, r] = await Promise.all([pendientesAlta(p.id), resumenPanel(p.id)]);
  const estado = ESTADO[p.estado] ?? ESTADO.borrador!;
  const borrador = p.estado === "borrador";
  const publicado = p.estado === "aprobado" || p.estado === "en_revision";

  const deSeccion = (s: SeccionPanel) => alta.tareas.filter((t) => t.seccion === s);
  const faltan = (s: SeccionPanel) => deSeccion(s).filter((t) => !t.ok).length;
  // En borrador cada sección dice si está lista; después solo se marca lo que falte (p. ej. «Sobre mí»).
  const marca = (s: SeccionPanel): MarcaSeccion => (faltan(s) > 0 ? "pendiente" : borrador ? "ok" : undefined);
  const numero = alta.siguiente ? alta.tareas.indexOf(alta.siguiente) + 1 : alta.tareas.length;

  return (
    <div className="flex min-h-dvh flex-col bg-[#F3EFE7] lg:flex-row">
      <MenuProveedor
        nombre={p.nombre}
        slug={p.slug}
        estado={estado}
        avance={{ porcentaje: alta.porcentaje, texto: alta.porcentaje === 100 ? "Tu perfil está completo" : `${alta.hechas} de ${alta.tareas.length} pasos listos` }}
        marcas={{ perfil: marca("perfil"), servicios: marca("servicios"), verificacion: marca("verificacion"), confirmar: alta.listo ? "pendiente" : "bloqueado" }}
        pendientes={{ perfil: faltan("perfil"), servicios: faltan("servicios"), verificacion: faltan("verificacion") }}
        borrador={borrador}
        publicado={publicado}
        resenasSinResponder={r.resenasSinResponder}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borde bg-crema px-5 py-5 lg:px-8">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate font-display text-[26px] font-extrabold tracking-[-0.8px] lg:text-[30px]">{p.nombre}</h1>
            <span className="truncate font-mono text-sm text-gris">lastresb.com.co/{p.slug}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`flex h-8 items-center rounded-2xl px-3.5 text-sm font-semibold ${estado.clase}`}>{estado.texto}</span>
            {publicado && <Link href={`/${p.slug}`} className="flex h-10 items-center rounded-xl border-[1.5px] border-borde-campo bg-white px-4 text-sm font-semibold">Ver mi página</Link>}
          </div>
        </header>
        <main className="flex w-full max-w-[1000px] flex-col gap-5 px-5 pb-14 pt-6 lg:px-8">
          {borrador && (
            <GuiaAlta
              siguiente={alta.siguiente && !alta.listo ? { titulo: alta.siguiente.titulo, texto: alta.siguiente.texto, href: alta.siguiente.href, numero } : null}
              total={alta.tareas.length}
              listo={alta.listo}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
