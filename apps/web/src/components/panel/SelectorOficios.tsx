"use client";

/** Oficios del proveedor en listas desplegables: empieza con uno y se agregan hasta 3 con «Agregar otro oficio». */
import { useState } from "react";

const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";

export function SelectorOficios({ oficios, elegidos, maximo = 3 }: { oficios: { id: number; nombre: string }[]; elegidos: number[]; maximo?: number }) {
  const [filas, setFilas] = useState<(number | "")[]>(elegidos.length > 0 ? elegidos.slice(0, maximo) : [""]);
  const cambiar = (i: number, v: string) => setFilas((f) => f.map((x, j) => (j === i ? (v ? Number(v) : "") : x)));
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold">¿Qué oficios ofreces? <span className="font-normal text-gris">(hasta {maximo})</span></legend>
      {filas.map((v, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <label htmlFor={`oficio-${i}`} className="text-sm text-gris">{i === 0 ? "Oficio principal" : `Otro oficio ${i + 1}`}</label>
          <div className="flex items-center gap-2 sm:max-w-md">
            <select id={`oficio-${i}`} name="categoria" required={i === 0} value={v} onChange={(e) => cambiar(i, e.target.value)} className={campo}>
              <option value="">{i === 0 ? "Elige tu oficio" : "Elige un oficio"}</option>
              {oficios.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
            {i > 0 && <button type="button" onClick={() => setFilas((f) => f.filter((_, j) => j !== i))} className="min-h-11 flex-none px-2 text-sm font-semibold text-ladrillo-oscuro">Quitar</button>}
          </div>
        </div>
      ))}
      {filas.length < maximo && (
        <button type="button" onClick={() => setFilas((f) => [...f, ""])} className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-verde">+ Agregar otro oficio</button>
      )}
      <p className="text-sm text-gris">Cada servicio que ofrezcas va dentro de uno de estos oficios. Si cambias de oficio más adelante, te preguntaremos si quieres ajustar tus opciones de «Cómo trabajas».</p>
    </fieldset>
  );
}
