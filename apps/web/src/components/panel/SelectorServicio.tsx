"use client";

/**
 * Servicio de un proveedor, dentro de uno de sus oficios (CU-35): el oficio y, según él, un menú con los servicios que aplican
 * (salen del catálogo: `serviciosSugeridos`), más «Otro servicio» para escribirlo. Lo usan el panel del proveedor y el alta asistida.
 * Envía el oficio (`oficioCampo`) y el nombre final del servicio (`nombreCampo`) como campos normales del formulario.
 * Con `observar` (alta asistida) el oficio solo puede ser uno de los oficios que el equipo marcó (casillas «categoria») en el mismo formulario.
 */
import { useEffect, useRef, useState } from "react";

export type OficioServicio = { id: number; nombre: string; slug: string };

const OTRO = "__otro";

export function SelectorServicio({
  oficios,
  sugeridos,
  mostrarOficio,
  oficioInicial,
  nombreInicial = "",
  oficioCampo = "categoriaId",
  nombreCampo = "nombre",
  etiquetaOficio = "¿De cuál de tus oficios es este servicio?",
  etiquetaServicio = "Servicio",
  opcional = false,
  observar = false,
  claseCampo,
  claseEtiqueta = "text-sm font-semibold",
  claseGrupo = "flex flex-col gap-1.5",
}: {
  oficios: OficioServicio[];
  /** Servicios que aplican a cada oficio, por id de oficio. */
  sugeridos: Record<number, string[]>;
  /** Mostrar el menú de oficio (varios oficios). Con uno solo, el oficio es ese. */
  mostrarOficio: boolean;
  oficioInicial?: number | null;
  nombreInicial?: string;
  oficioCampo?: string;
  nombreCampo?: string;
  etiquetaOficio?: string;
  etiquetaServicio?: string;
  opcional?: boolean;
  observar?: boolean;
  claseCampo: string;
  claseEtiqueta?: string;
  claseGrupo?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [marcados, setMarcados] = useState<number[] | null>(observar ? [] : null);
  const disponibles = marcados ? oficios.filter((o) => marcados.includes(o.id)) : oficios;

  const [oficio, setOficio] = useState<number | "">(oficioInicial ?? "");
  const efectivo = disponibles.find((o) => o.id === oficio)?.id ?? disponibles[0]?.id;
  const opciones = efectivo != null ? (sugeridos[efectivo] ?? []) : [];

  const enLista = nombreInicial !== "" && (Object.values(sugeridos).some((l) => l.includes(nombreInicial)));
  const [sel, setSel] = useState<string>(nombreInicial === "" ? "" : enLista ? nombreInicial : OTRO);
  const [texto, setTexto] = useState(enLista ? "" : nombreInicial);

  // Alta asistida: sigue las casillas de oficios del mismo formulario.
  useEffect(() => {
    if (!observar) return;
    const form = raiz.current?.closest("form");
    if (!form) return;
    const leer = () => setMarcados([...form.querySelectorAll<HTMLInputElement>('input[name="categoria"]:checked')].map((c) => Number(c.value)));
    leer();
    form.addEventListener("change", leer);
    return () => form.removeEventListener("change", leer);
  }, [observar]);

  // Al cambiar de oficio, un servicio elegido de la lista anterior ya no aplica.
  useEffect(() => {
    if (sel !== "" && sel !== OTRO && !opciones.includes(sel)) setSel("");
  }, [efectivo]); // eslint-disable-line react-hooks/exhaustive-deps

  const nombreFinal = sel === OTRO ? texto.trim() : sel;
  const id = `${nombreCampo}-${oficioCampo}`;

  return (
    <div ref={raiz} className="contents">
      {mostrarOficio && (
        <div className={`${claseGrupo} sm:col-span-3`}>
          <label htmlFor={`${id}-of`} className={claseEtiqueta}>{etiquetaOficio}</label>
          <select id={`${id}-of`} name={oficioCampo} value={efectivo ?? ""} onChange={(e) => setOficio(e.target.value ? Number(e.target.value) : "")} className={claseCampo}>
            {disponibles.length === 0 && <option value="">{observar ? "Marca primero los oficios de arriba" : "Sin oficios"}</option>}
            {disponibles.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </div>
      )}
      <div className={`${claseGrupo} sm:col-span-3`}>
        <label htmlFor={`${id}-sv`} className={claseEtiqueta}>{etiquetaServicio}</label>
        <select id={`${id}-sv`} value={sel} onChange={(e) => setSel(e.target.value)} required={!opcional} className={claseCampo}>
          <option value="">{opciones.length > 0 ? "Elige un servicio" : "Elige primero el oficio"}</option>
          {opciones.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value={OTRO}>Otro servicio (escribirlo)</option>
        </select>
        {sel === OTRO && <input value={texto} onChange={(e) => setTexto(e.target.value)} required maxLength={80} placeholder="Escribe el nombre del servicio" aria-label="Nombre del servicio" className={claseCampo} />}
        <input type="hidden" name={nombreCampo} value={nombreFinal} />
      </div>
    </div>
  );
}
