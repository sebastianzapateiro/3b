"use client";

/** P2 · Selector «Ordenar por»: el orden se aplica al cambiarlo, sin botón aparte. */
import { useRouter } from "next/navigation";

export function SelectorOrden({ actual, opciones, base }: { actual: string; opciones: { valor: string; texto: string }[]; base: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 text-sm text-tinta-2">
      <label htmlFor="orden">Ordenar por</label>
      <select
        id="orden"
        value={actual}
        onChange={(e) => {
          const p = new URLSearchParams(base);
          p.delete("pagina");
          p.set("orden", e.target.value);
          router.push(`/proveedores?${p}`, { scroll: false });
        }}
        className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white px-2.5 text-sm font-semibold text-tinta"
      >
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    </div>
  );
}
