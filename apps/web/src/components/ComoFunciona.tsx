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
    <li id={id} className="flex scroll-mt-24 flex-col overflow-hidden rounded-[30px] border border-borde bg-white sm:min-h-[300px] sm:flex-row">
      <div className={`flex flex-none items-center justify-center px-6 py-7 sm:w-[320px] ${p.fondo}`}>
        <Pantallazo icono={paso.icono} sobreClaro={p.claro} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 px-6 py-6 sm:px-9 sm:py-8">
        <span className={`inline-flex h-9 w-fit items-center rounded-full px-4 text-[15px] font-extrabold uppercase tracking-[.14em] ${p.pastilla}`}>Paso {n}</span>
        <h3 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[30px]">{paso.titulo}</h3>
        <p className="text-base leading-normal text-tinta-2 sm:text-[17px]">{paso.texto}</p>
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
