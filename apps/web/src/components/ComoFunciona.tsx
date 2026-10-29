import Link from "next/link";
import { Pantallazo } from "@/components/ComoFuncionaPantallas";
import { ComoFuncionaTabs } from "@/components/ComoFuncionaTabs";
import { COMO_FUNCIONA, type ColorPanel, type PasoComo, type PestanaComo } from "@/lib/como-funciona.content";

/**
 * «¿Cómo funciona LasTresB?»: pestañas Cliente / Proveedor con un bloque por paso.
 * A la izquierda, un pantallazo de ejemplo del portal; a la derecha, el paso. Componente de servidor; solo las pestañas son cliente.
 */

const PANEL: Record<ColorPanel, { fondo: string; pastilla: string; claro: boolean }> = {
  verde: { fondo: "bg-verde", pastilla: "bg-verde text-white", claro: false },
  ladrillo: { fondo: "bg-ladrillo", pastilla: "bg-ladrillo text-white", claro: false },
  amarillo: { fondo: "bg-amarillo", pastilla: "bg-amarillo text-tinta", claro: true },
  tinta: { fondo: "bg-tinta", pastilla: "bg-tinta text-white", claro: false },
};

function Paso({ paso, n, id }: { paso: PasoComo; n: number; id?: string }) {
  const p = PANEL[paso.panel];
  return (
    <li id={id} className="flex scroll-mt-24 flex-col overflow-hidden rounded-[30px] border border-borde bg-white sm:flex-row-reverse">
      <div className="flex flex-none items-center justify-center px-5 pb-1 pt-5 sm:w-[340px] sm:p-5 sm:pl-0">
        <Pantallazo icono={paso.icono} />
      </div>
      <div className="flex flex-1 items-center gap-4 px-5 py-6 sm:gap-6 sm:px-8 sm:py-8">
        {/* Bola con el número del paso, a la izquierda. */}
        <span aria-label={`Paso ${n}`} className={`flex size-[76px] flex-none flex-col items-center justify-center rounded-full leading-none sm:size-[96px] ${p.pastilla}`}>
          <span aria-hidden="true" className="text-[11px] font-bold uppercase tracking-[.14em] sm:text-xs">Paso</span>
          <span aria-hidden="true" className="font-display text-[34px] font-extrabold sm:text-[46px]">{n}</span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h3 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[28px]">{paso.titulo}</h3>
          <p className="text-base leading-normal text-tinta-2 sm:text-[17px]">{paso.texto}</p>
        </div>
      </div>
    </li>
  );
}

function Panel({ pestana }: { pestana: PestanaComo }) {
  const boton = pestana.boton;
  return (
    <>
      <ol className="flex flex-col gap-5">
        {pestana.pasos.map((paso, i) => <Paso key={paso.titulo} paso={paso} n={i + 1} id={pestana.id === "cliente" ? `paso-${i + 1}` : undefined} />)}
      </ol>
      <div className="flex justify-center pt-8">
        <Link
          href={boton.href}
          className={`flex h-[54px] items-center justify-center rounded-full px-9 text-[17px] font-bold ${boton.tono === "amarillo" ? "bg-amarillo text-tinta hover:brightness-95" : "bg-tinta text-crema hover:bg-verde-oscuro"}`}
        >
          {boton.texto}
        </Link>
      </div>
    </>
  );
}

export function ComoFunciona() {
  return (
    <>
      <header className="flex flex-col gap-2.5">
        <h1 className="text-balance font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-5xl">{COMO_FUNCIONA.titulo}</h1>
        <p className="max-w-[640px] text-base leading-normal text-tinta-2 sm:text-lg">{COMO_FUNCIONA.subtitulo}</p>
      </header>
      <ComoFuncionaTabs
        pestanas={COMO_FUNCIONA.pestanas.map((p) => ({ id: p.id, titulo: p.titulo, subtexto: p.subtexto, acento: p.acento, panel: <Panel pestana={p} /> }))}
      />
    </>
  );
}
