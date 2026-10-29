"use client";

/** Chips de oficios populares que rellenan el campo «¿Qué servicio necesitas?» del formulario de demanda. */
export function ChipsDemanda({ sugerencias }: { sugerencias: string[] }) {
  function rellenar(texto: string) {
    const campo = document.getElementById("d-texto") as HTMLInputElement | null;
    if (campo) {
      campo.value = texto;
      campo.focus();
    }
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Servicios frecuentes">
      {sugerencias.map((s) => (
        <li key={s}><button type="button" onClick={() => rellenar(s)} className="flex min-h-11 items-center rounded-full border border-borde bg-crema px-4 text-sm font-medium text-tinta hover:border-verde hover:text-verde-oscuro">{s}</button></li>
      ))}
    </ul>
  );
}