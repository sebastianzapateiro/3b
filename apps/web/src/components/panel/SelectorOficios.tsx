"use client";

/**
 * Oficios del proveedor en listas desplegables: empieza con uno y se agregan hasta 3 con «Agregar otro oficio».
 * En el panel los valores son ids (vienen de la base); en el registro, `porSlug`: los valores son slugs del catálogo,
 * que no dependen de la base para mostrarse (el servidor los resuelve al crear el perfil).
 */
import { useState } from "react";
import { AVISO_SERVICIOS_SALUD, esOficioConAvisoSalud } from "@las3b/shared";

const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";

type Oficio = { id: number | string; nombre: string; slug?: string; grupo?: string };

export function SelectorOficios({ oficios, elegidos, maximo = 3, porSlug = false }: { oficios: Oficio[]; elegidos: (number | string)[]; maximo?: number; porSlug?: boolean }) {
  const [filas, setFilas] = useState<string[]>(elegidos.length > 0 ? elegidos.slice(0, maximo).map(String) : [""]);
  const cambiar = (i: number, v: string) => setFilas((f) => f.map((x, j) => (j === i ? v : x)));
  const conAviso = filas.some((v) => oficios.some((o) => String(o.id) === v && o.slug && esOficioConAvisoSalud(o.slug)));
  const grupos = [...new Set(oficios.map((o) => o.grupo).filter((g): g is string => Boolean(g)))];
  const opcion = (o: Oficio) => <option key={o.id} value={String(o.id)}>{o.nombre}</option>;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold">¿Qué oficios ofreces? <span className="font-normal text-gris">(hasta {maximo})</span></legend>
      {filas.map((v, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <label htmlFor={`oficio-${i}`} className="text-sm text-gris">{i === 0 ? "Oficio principal" : `Otro oficio ${i + 1}`}</label>
          <div className="flex items-center gap-2 sm:max-w-md">
            <select id={`oficio-${i}`} name="categoria" required={i === 0} value={v} onChange={(e) => cambiar(i, e.target.value)} className={campo}>
              <option value="">{i === 0 ? "Elige tu oficio" : "Elige un oficio"}</option>
              {grupos.length > 0
                ? grupos.map((g) => <optgroup key={g} label={g}>{oficios.filter((o) => o.grupo === g).map(opcion)}</optgroup>)
                : oficios.map(opcion)}
            </select>
            {i > 0 && <button type="button" onClick={() => setFilas((f) => f.filter((_, j) => j !== i))} className="min-h-11 flex-none px-2 text-sm font-semibold text-ladrillo-oscuro">Quitar</button>}
          </div>
        </div>
      ))}
      {conAviso && <p role="note" className="rounded-[14px] border-2 border-amarillo-oscuro bg-amarillo-suave p-3 text-sm leading-snug text-amarillo-oscuro"><b>Aviso importante.</b> {AVISO_SERVICIOS_SALUD} Al publicar tendrás que aceptarlo.</p>}
      {filas.length < maximo && (
        <button type="button" onClick={() => setFilas((f) => [...f, ""])} className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-verde">+ Agregar otro oficio</button>
      )}
      <p className="text-sm text-gris">
        {porSlug
          ? "Cada servicio que ofrezcas va dentro de uno de estos oficios. Puedes cambiarlos después."
          : "Cada servicio que ofrezcas va dentro de uno de estos oficios. Si cambias de oficio más adelante, te preguntaremos si quieres ajustar tus opciones de «Cómo trabajas»."}
      </p>
    </fieldset>
  );
}
