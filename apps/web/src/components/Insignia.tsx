import type { InsigniaPublica } from "@/lib/portafolio-completo";

/** Chip de insignia del proveedor (mockup Perfil). */
export function Insignia({ insignia }: { insignia: InsigniaPublica }) {
  const tono: Record<string, { bg: string; text: string }> = {
    verificado: { bg: "bg-verde-claro", text: "text-verde-oscuro" },
    formalizado: { bg: "bg-amarillo-suave", text: "text-amarillo-oscuro" },
    apto_menores: { bg: "bg-ladrillo-suave", text: "text-ladrillo-oscuro" },
    certificado: { bg: "bg-verde-claro", text: "text-verde-oscuro" },
  };
  const t = tono[insignia.clave] ?? { bg: "bg-borde-suave", text: "text-gris" };

  return (
    <span
      className={`flex h-[26px] items-center rounded-[13px] px-2.5 text-xs font-semibold ${t.bg} ${t.text}`}
    >
      {insignia.nombre}
    </span>
  );
}
