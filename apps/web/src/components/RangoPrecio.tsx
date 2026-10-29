"use client";

import { useState } from "react";

const MAXIMO = 300_000;
const PASO = 10_000;
const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** Control «Precio de visita hasta»: sin tocarlo (en el máximo) no filtra por precio. */
export function RangoPrecio({ id, valorInicial }: { id: string; valorInicial?: number }) {
  const [valor, setValor] = useState(valorInicial ?? MAXIMO);
  const sinLimite = valor >= MAXIMO;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">Precio de visita hasta</label>
      <input id={id} type="range" min={PASO} max={MAXIMO} step={PASO} value={valor} onChange={(e) => setValor(Number(e.target.value))} className="accent-verde" />
      <span className="text-[13px] text-gris">{sinLimite ? "Sin límite" : pesos.format(valor)}</span>
      {!sinLimite && <input type="hidden" name="precioMax" value={valor} />}
    </div>
  );
}
