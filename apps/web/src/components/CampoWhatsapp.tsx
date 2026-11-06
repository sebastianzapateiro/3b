"use client";

/**
 * Campo de WhatsApp o celular con el «+57» fijo al lado: la persona escribe solo sus 10 dígitos (todos son números de Bogotá).
 * Si pega el número con indicativo («+57 300…», «57300…») se lo quitamos del campo. Se envía como texto normal (`name`) y el servidor
 * lo guarda con el formato estándar «+57XXXXXXXXXX» (`normalizarWhatsapp`).
 */
import { INDICATIVO_CO, whatsappSinIndicativo } from "@las3b/shared";
import { useState } from "react";

export function CampoWhatsapp({
  id,
  name = "whatsapp",
  defaultValue = "",
  required = true,
  className,
  placeholder = "300 123 4567",
  ...resto
}: {
  id?: string;
  name?: string;
  /** Valor guardado (con o sin indicativo): se muestra sin él. */
  defaultValue?: string;
  required?: boolean;
  /** Clases del campo de texto (las mismas del resto de campos del formulario). */
  className: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "defaultValue" | "name" | "id" | "type" | "value" | "onChange">) {
  const [valor, setValor] = useState(defaultValue ? whatsappSinIndicativo(defaultValue) : "");

  function alCambiar(e: React.ChangeEvent<HTMLInputElement>) {
    let d = e.target.value.replace(/\D/g, "");
    if (d.length > 10 && d.startsWith("57")) d = d.slice(2); // pegó el número con indicativo
    d = d.slice(0, 10);
    setValor(d.length > 6 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d);
  }

  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-borde-campo px-3 text-[15px] font-semibold text-tinta-2">{INDICATIVO_CO}</span>
      <input id={id} name={name} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} value={valor} onChange={alCambiar} placeholder={placeholder} aria-label={resto["aria-label"] ?? "Número de WhatsApp, sin el +57"} className={`${className} pl-16`} {...resto} />
    </div>
  );
}
