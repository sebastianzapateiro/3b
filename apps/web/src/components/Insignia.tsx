import type { InsigniaPublica } from "@/lib/portafolio-completo";

/** Chip de insignia del proveedor (mockup Perfil). */
export function Insignia({ insignia }: { insignia: InsigniaPublica }) {
  const tono: Record<string, string> = {
    verificado: "bg-verde-claro text-verde-oscuro",
    formalizado: "bg-amarillo-suave text-amarillo-oscuro",
    apto_menores: "bg-ladrillo-suave text-ladrillo-oscuro",
    certificado: "bg-verde-claro text-verde-oscuro",
  };

  return (
    <span className={`flex h-7 items-center rounded-[14px] px-2.5 text-[13px] font-semibold ${tono[insignia.clave] ?? "bg-piedra text-tinta-2"}`}>
      {insignia.nombre}
    </span>
  );
}
