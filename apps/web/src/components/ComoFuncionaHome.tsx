import Link from "next/link";
import { COLOR, MediaPaso } from "@/components/ComoFuncionaMedia";
import { ComoFuncionaTabs } from "@/components/ComoFuncionaTabs";
import { COMO_FUNCIONA, type PestanaComo } from "@/lib/como-funciona.content";

/**
 * Home · recorrido corto «cómo funciona» (P2/P3). Horizontal desde 900px; vertical en móvil.
 * Servidor; solo las pestañas son cliente.
 */
function Recorrido({ pestana }: { pestana: PestanaComo }) {
  const n = pestana.pasos.length;
  return (
    <ol className={`relative grid gap-7 min-[900px]:gap-4 ${n === 5 ? "min-[900px]:grid-cols-5" : "min-[900px]:grid-cols-4"}`}>
      {/* Línea punteada por detrás de los círculos: vertical en móvil, horizontal en escritorio. */}
      <span aria-hidden="true" className="absolute bottom-11 left-11 top-11 border-l-4 border-dotted border-borde-campo min-[900px]:hidden" />
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-[65px] hidden border-t-4 border-dotted border-borde-campo min-[900px]:block" />
      {pestana.pasos.map((p, i) => (
        <li key={p.titulo} className="relative flex items-start gap-4 min-[900px]:flex-col min-[900px]:items-center min-[900px]:gap-3 min-[900px]:text-center">
          <div className="relative flex-none">
            <div className={`relative size-22 overflow-hidden rounded-full border-4 border-crema ring-2 min-[900px]:size-[130px] min-[900px]:border-[5px] ${COLOR[p.color].aro}`}>
              <MediaPaso paso={p} sizes="130px" tamanoIcono="size-9 min-[900px]:size-12" />
            </div>
            <span className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-white font-display text-base font-extrabold text-ladrillo shadow-md min-[900px]:size-[38px] min-[900px]:text-lg">{i + 1}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1 pt-1 min-[900px]:pt-0">
            <h3 className="font-display text-lg font-extrabold leading-tight">{p.titulo}</h3>
            <p className="text-[13px] leading-[1.45] text-tinta-2">{p.corto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ComoFuncionaHome() {
  const h = COMO_FUNCIONA.home;
  return (
    <section aria-labelledby="como-home-titulo" className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="flex max-w-[720px] flex-col gap-2">
          <h2 id="como-home-titulo" className="text-balance font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">{h.titulo}</h2>
          <p className="text-base text-tinta-2 sm:text-lg">{h.subtitulo}</p>
        </div>
        <Link href="/como-funciona" className="inline-flex min-h-11 items-center font-bold text-ladrillo hover:text-ladrillo-oscuro">{h.enlace}</Link>
      </header>
      <ComoFuncionaTabs
        prefijo="como-home"
        pestanas={COMO_FUNCIONA.pestanas.map((p) => ({ id: p.id, titulo: p.titulo, subtexto: p.subtexto, panel: <Recorrido pestana={p} /> }))}
      />
      <div className="flex justify-center">
        <Link href="/como-funciona" className="flex h-13 items-center justify-center rounded-full border-2 border-tinta px-8 text-base font-bold text-tinta hover:bg-tinta hover:text-crema">{h.boton}</Link>
      </div>
    </section>
  );
}
