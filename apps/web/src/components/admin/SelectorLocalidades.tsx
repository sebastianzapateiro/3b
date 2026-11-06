"use client";

/**
 * Localidades de un proveedor para el equipo (CU-51, B1): casillas en 3 columnas y «Todo Bogotá» primero, que marca o desmarca las 20.
 * Envía cada localidad marcada como `localidad` (el servidor no cambia); «Todo Bogotá» solo ayuda a marcar y no se envía.
 */
import { useState } from "react";

const casilla = "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[15px] hover:bg-piedra";

export function SelectorLocalidades({ locs, inicial = [] }: { locs: { id: number; nombre: string }[]; inicial?: number[] }) {
  const [marcadas, setMarcadas] = useState<number[]>(inicial);
  const todoBogota = locs.length > 0 && marcadas.length === locs.length;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-2 text-sm font-semibold">Localidades donde trabaja</legend>
      <div className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
        <label className={`${casilla} font-semibold`}>
          <input type="checkbox" checked={todoBogota} onChange={() => setMarcadas(todoBogota ? [] : locs.map((l) => l.id))} className="size-[18px] accent-verde" />
          Todo Bogotá
        </label>
        {locs.map((l) => (
          <label key={l.id} className={casilla}>
            <input type="checkbox" name="localidad" value={l.id} checked={marcadas.includes(l.id)} onChange={() => setMarcadas((m) => (m.includes(l.id) ? m.filter((x) => x !== l.id) : [...m, l.id]))} className="size-[18px] accent-verde" />
            {l.nombre}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
