import Link from "next/link";
import { COLOR, MediaPaso } from "@/components/ComoFuncionaMedia";
import { ComoFuncionaTabs } from "@/components/ComoFuncionaTabs";
import { COMO_FUNCIONA, type PestanaComo } from "@/lib/como-funciona.content";

/**
 * /como-funciona · filas alternadas (foto o degradado con icono + número grande + texto completo). Servidor; solo las pestañas son cliente.
 * Los ids de ancla (paso-N, proveedor-paso-N) los usa el HowTo de la página.
 */
function Panel({ pestana }: { pestana: PestanaComo }) {
  const b = pestana.boton;
  const ancla = pestana.id === "cliente" ? "paso" : "proveedor-paso";
  return (
    <>
      <h2 className="sr-only">{pestana.id === "cliente" ? "Si buscas un servicio" : "Si ofreces un servicio"}</h2>
      <ol className="flex flex-col gap-[34px]">
        {pestana.pasos.map((p, i) => (
          <li key={p.titulo} id={`${ancla}-${i + 1}`} className={`flex scroll-mt-24 flex-col gap-5 min-[900px]:items-center min-[900px]:gap-10 ${i % 2 ? "min-[900px]:flex-row-reverse" : "min-[900px]:flex-row"}`}>
            <div className="relative h-[200px] w-full flex-none overflow-hidden rounded-[30px] min-[900px]:h-[250px] min-[900px]:w-[46%]">
              <MediaPaso paso={p} sizes="(min-width: 900px) 46vw, 100vw" tamanoIcono="size-16" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span aria-hidden="true" className={`font-display text-[64px] font-extrabold leading-[.9] min-[900px]:text-[96px] ${COLOR[p.color].numero}`}>{i + 1}</span>
              <h3 className="font-display text-2xl font-extrabold leading-tight min-[900px]:text-[30px]"><span className="sr-only">Paso {i + 1}: </span>{p.titulo}</h3>
              <p className="text-base leading-[1.55] text-tinta-2 min-[900px]:text-[16.5px]">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex justify-center pt-10">
        <Link href={b.href} className={`flex h-[54px] items-center justify-center rounded-full px-9 text-[17px] font-bold ${b.tono === "amarillo" ? "bg-amarillo text-tinta hover:brightness-95" : "bg-tinta text-crema hover:bg-verde-oscuro"}`}>{b.texto}</Link>
      </div>
    </>
  );
}

export function ComoFuncionaPagina() {
  return (
    <>
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-balance font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[54px]">{COMO_FUNCIONA.titulo}</h1>
        <p className="mx-auto max-w-[640px] text-base leading-normal text-tinta-2 sm:text-lg">{COMO_FUNCIONA.subtitulo}</p>
      </header>
      <ComoFuncionaTabs
        prefijo="como"
        sincronizar
        pestanas={COMO_FUNCIONA.pestanas.map((p) => ({ id: p.id, titulo: p.titulo, subtexto: p.subtexto, panel: <Panel pestana={p} /> }))}
      />
    </>
  );
}
