import Link from "next/link";
import { IconoComo } from "@/components/ComoFuncionaIconos";
import { ComoFuncionaTabs } from "@/components/ComoFuncionaTabs";
import { COMO_FUNCIONA, type ColorPanel, type PasoComo, type PestanaComo } from "@/lib/como-funciona.content";

/**
 * Sección «¿Cómo funciona LasTresB?» de la home: pestañas Cliente / Proveedor con pasos numerados.
 * Componente de servidor; solo las pestañas son cliente (ComoFuncionaTabs).
 */

/** Colores del panel y variables de los iconos (sobre amarillo, el icono va en tinta). */
const PANEL: Record<ColorPanel, { fondo: string; etiqueta: string; vars: Record<string, string> }> = {
  verde: { fondo: "bg-verde", etiqueta: "text-verde", vars: { "--c1": "#FBF7F0", "--c2": "#F5B700", "--c3": "rgb(251 247 240 / .16)", "--ink": "#1B2623" } },
  ladrillo: { fondo: "bg-ladrillo", etiqueta: "text-ladrillo", vars: { "--c1": "#FBF7F0", "--c2": "#F5B700", "--c3": "rgb(251 247 240 / .16)", "--ink": "#1B2623" } },
  amarillo: { fondo: "bg-amarillo", etiqueta: "text-amarillo-oscuro", vars: { "--c1": "#1B2623", "--c2": "#FBF7F0", "--c3": "rgb(27 38 35 / .12)", "--ink": "#1B2623" } },
  tinta: { fondo: "bg-tinta", etiqueta: "text-tinta", vars: { "--c1": "#FBF7F0", "--c2": "#F5B700", "--c3": "rgb(251 247 240 / .14)", "--ink": "#1B2623" } },
};

function Paso({ paso, n }: { paso: PasoComo; n: number }) {
  const p = PANEL[paso.panel];
  return (
    <li className="flex min-h-[170px] flex-col overflow-hidden rounded-[30px] border border-borde bg-white sm:flex-row">
      <div className={`relative flex h-[120px] flex-none items-center justify-center overflow-hidden sm:h-auto sm:w-[240px] ${p.fondo}`} style={p.vars as React.CSSProperties} aria-hidden="true">
        <span className="absolute -top-5 left-3 font-display text-[110px] font-extrabold leading-none text-white opacity-[.22] sm:-top-6 sm:text-[150px]" style={{ color: paso.panel === "amarillo" ? "#1B2623" : "#FFFFFF" }}>
          {n}
        </span>
        <span className="relative scale-[.85] sm:scale-100"><IconoComo icono={paso.icono} /></span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-6 py-5 sm:px-8 sm:py-[22px]">
        <span className={`text-xs font-bold uppercase tracking-[.14em] ${p.etiqueta}`}>Paso {n}</span>
        <h3 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[27px]">{paso.titulo}</h3>
        <p className="text-base leading-normal text-tinta-2 sm:text-[16.5px]">{paso.texto}</p>
      </div>
    </li>
  );
}

function Panel({ pestana }: { pestana: PestanaComo }) {
  const boton = pestana.boton;
  return (
    <>
      <ol className="flex flex-col gap-[18px]">
        {pestana.pasos.map((paso, i) => <Paso key={paso.titulo} paso={paso} n={i + 1} />)}
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
    <section id="como" aria-labelledby="como-titulo" className="scroll-mt-4 bg-crema">
      <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-5 pb-10 pt-4 sm:gap-8 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-2.5">
          <h2 id="como-titulo" className="text-balance font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">{COMO_FUNCIONA.titulo}</h2>
          <p className="max-w-[640px] text-base leading-normal text-tinta-2 sm:text-lg">{COMO_FUNCIONA.subtitulo}</p>
        </header>
        <ComoFuncionaTabs
          pestanas={COMO_FUNCIONA.pestanas.map((p) => ({ id: p.id, titulo: p.titulo, subtexto: p.subtexto, acento: p.acento, panel: <Panel pestana={p} /> }))}
        />
      </div>
    </section>
  );
}
