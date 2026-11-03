/** P8 · Anillo de avance del perfil del proveedor (0–100 %). Sin estado: sirve en servidor y cliente. */
export function AnilloAvance({ porcentaje, tamano = 64, grosor = 7, claro = false }: { porcentaje: number; tamano?: number; grosor?: number; claro?: boolean }) {
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, porcentaje));
  return (
    <span className="relative inline-flex flex-none items-center justify-center" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} aria-hidden="true" className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" strokeWidth={grosor} className={claro ? "stroke-white/15" : "stroke-piedra"} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p / 100)}
          className={`transition-[stroke-dashoffset] duration-500 ${p === 100 ? "stroke-verde" : "stroke-amarillo"}`}
        />
      </svg>
      <b className={`absolute font-display tabular-nums ${claro ? "text-white" : "text-tinta"}`} style={{ fontSize: Math.round(tamano * 0.27) }}>
        {p}%
      </b>
    </span>
  );
}
