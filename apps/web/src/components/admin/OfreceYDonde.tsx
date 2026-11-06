"use client";

/**
 * Alta asistida (CU-51) · «Qué ofrece y dónde»: oficios, localidades y el primer servicio, con estado propio
 * (el servicio depende de los oficios marcados). Las localidades van como casillas en 3 columnas y la primera,
 * «Todo Bogotá», marca o desmarca las 20. Envía los mismos campos de siempre: `categoria`, `localidad`, `servicioCategoria`, `servicio`.
 */
import { useState } from "react";
import { SelectorServicio, type OficioServicio } from "@/components/panel/SelectorServicio";

const chip = "flex h-[38px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-borde-campo px-3.5 text-sm has-[:checked]:border-verde has-[:checked]:bg-verde has-[:checked]:font-semibold has-[:checked]:text-white";
const casilla = "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[15px] hover:bg-piedra";

export function OfreceYDonde({ cats, locs, sugeridos, claseCampo }: { cats: OficioServicio[]; locs: { id: number; nombre: string }[]; sugeridos: Record<number, string[]>; claseCampo: string }) {
  const [oficios, setOficios] = useState<number[]>([]);
  const [localidades, setLocalidades] = useState<number[]>([]);
  const todoBogota = locs.length > 0 && localidades.length === locs.length;

  const alternar = (lista: number[], id: number) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  return (
    <>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-2 text-sm font-semibold">Oficios <span className="font-normal text-gris">(puede tener varios)</span></legend>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <label key={c.id} className={chip}>
              <input type="checkbox" name="categoria" value={c.id} checked={oficios.includes(c.id)} onChange={() => setOficios((o) => alternar(o, c.id))} className="size-4 accent-white" />
              {c.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-2 text-sm font-semibold">Localidades donde trabaja</legend>
        <div className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* «Todo Bogotá» no se envía: marca o desmarca todas las localidades, que sí se envían una a una. */}
          <label className={`${casilla} font-semibold`}>
            <input type="checkbox" checked={todoBogota} onChange={() => setLocalidades(todoBogota ? [] : locs.map((l) => l.id))} className="size-[18px] accent-verde" />
            Todo Bogotá
          </label>
          {locs.map((l) => (
            <label key={l.id} className={casilla}>
              <input type="checkbox" name="localidad" value={l.id} checked={localidades.includes(l.id)} onChange={() => setLocalidades((x) => alternar(x, l.id))} className="size-[18px] accent-verde" />
              {l.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3.5">
        {/* Oficio (solo los marcados arriba) y, según él, el menú de servicios que aplican; «Otro» para escribir uno. */}
        <SelectorServicio
          oficios={cats}
          sugeridos={sugeridos}
          mostrarOficio
          soloEstos={oficios}
          opcional
          oficioCampo="servicioCategoria"
          nombreCampo="servicio"
          etiquetaOficio="Oficio del primer servicio"
          etiquetaServicio="Primer servicio"
          claseCampo={claseCampo}
          claseGrupo="flex flex-col gap-1.5 flex-[1_1_100%]"
        />
        <span className="text-xs text-gris">Cada servicio va atado a un oficio marcado arriba. Más servicios se agregan después, en el perfil del proveedor.</span>
      </div>
    </>
  );
}
