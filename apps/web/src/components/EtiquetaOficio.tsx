/**
 * Etiqueta de oficio con color suave e ícono (P2, CU-01) para las tarjetas de /proveedores.
 * El color se reparte entre terracota, verde y amarillo suaves según el texto (siempre el mismo para un oficio);
 * el ícono sale de una palabra clave del oficio y, si no hay, es una estrella. Solo presentación.
 */
const TONOS = [
  "bg-coral-suave text-ladrillo-oscuro",
  "bg-verde-suave text-verde-oscuro",
  "bg-amarillo-suave text-amarillo-oscuro",
];

function indiceDe(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % TONOS.length;
}

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Palabra clave del oficio → trazado del ícono (24×24). */
const ICONOS: { clave: RegExp; d: string }[] = [
  { clave: /plomer|fuga|tuber/i, d: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" },
  { clave: /electric/i, d: "M13 2 4 14h7l-1 8 9-12h-7z" },
  { clave: /aseo|limpie/i, d: "M9 3h5v4l2 2v12H7V9l2-2zM11 3v4" },
  { clave: /idioma|ingl|clase|profe|tutor|escuel/i, d: "M2 8l10-5 10 5-10 5zM6 10.5V16c3 2.5 9 2.5 12 0v-5.5" },
  { clave: /piso|pint|construc|remodel|obra|carpint|cerraj/i, d: "M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6" },
];

function Icono({ texto }: { texto: string }) {
  const d = ICONOS.find((i) => i.clave.test(texto))?.d ?? "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...trazo} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function EtiquetaOficio({ texto }: { texto: string }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${TONOS[indiceDe(texto)]}`}>
      <Icono texto={texto} />
      <span className="truncate">{texto}</span>
    </span>
  );
}
