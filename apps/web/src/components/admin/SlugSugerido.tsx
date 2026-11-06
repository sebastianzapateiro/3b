"use client";

/**
 * Dirección de la página del proveedor en el alta asistida (CU-51, CU-41). Se sugiere sola con el modelo de la plataforma:
 * el nombre público («jorge-ramirez»; sin oficio ni localidad: la URL pública agrega el oficio, /nombre/oficio), y se actualiza mientras el equipo no la edite a mano.
 * Mientras es automática, si ya está en uso el servidor agrega un número («…-2»): no depende de nadie.
 */
import { useEffect, useRef, useState } from "react";
import { sugerirSlug } from "@las3b/shared";

export function SlugSugerido({ campo }: { campo: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [valor, setValor] = useState("");
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const form = raiz.current?.closest("form");
    if (!form) return;
    const sugerir = () => {
      const nombre = form.querySelector<HTMLInputElement>('input[name="nombrePublico"]')?.value ?? "";
      setValor((actual) => (manualRef.current ? actual : sugerirSlug(nombre)));
    };
    sugerir();
    form.addEventListener("input", sugerir);
    form.addEventListener("change", sugerir);
    return () => {
      form.removeEventListener("input", sugerir);
      form.removeEventListener("change", sugerir);
    };
  }, []);

  // El efecto de arriba lee el estado «manual» sin volver a suscribirse.
  const manualRef = useRef(false);
  manualRef.current = manual;

  return (
    <div ref={raiz} className="flex flex-col gap-1.5">
      <div className="flex h-11 max-w-[480px] items-center overflow-hidden rounded-xl border-[1.5px] border-verde">
        <span className="flex h-full items-center border-r-[1.5px] border-borde-campo bg-piedra px-2.5 font-mono text-[13px] font-semibold text-tinta-2">lastresb.com.co/</span>
        <input
          id="slug"
          name="slug"
          value={valor}
          onChange={(e) => {
            setManual(true);
            setValor(e.target.value);
          }}
          placeholder="se genera con el nombre público"
          className="h-full min-w-0 flex-1 px-2.5 font-mono text-sm outline-none"
        />
      </div>
      <input type="hidden" name={campo} value={manual ? "" : "1"} />
      <span className="text-xs text-gris">{manual ? "Dirección escrita por ti." : "Sugerida con el nombre público; se actualiza sola. Puedes cambiarla."}</span>
    </div>
  );
}
