/**
 * Ayuda humana durante el ingreso/inscripción: lleva al WhatsApp del equipo con el mensaje ya escrito.
 * El número sale de NEXT_PUBLIC_WHATSAPP_AYUDA (10 dígitos o con indicativo 57); sin él, no se muestra.
 */
const bruto = (process.env.NEXT_PUBLIC_WHATSAPP_AYUDA ?? "").replace(/\D/g, "");
const numero = bruto.length === 10 ? `57${bruto}` : bruto;

export function AyudaInscripcion({ tipo }: { tipo: "cliente" | "proveedor" | null }) {
  if (numero.length < 11) return null;
  const mensaje = tipo === "proveedor"
    ? "Hola, quiero inscribirme como proveedor en LasTresB y necesito ayuda."
    : "Hola, necesito ayuda para ingresar o crear mi cuenta en LasTresB.";
  const href = `https://wa.me/${numero}?${new URLSearchParams({ text: mensaje })}`;
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-verde-claro p-4 text-center">
      <p className="text-sm leading-snug text-tinta-2">¿Te perdiste o no te sale? Tranquilo, es normal. Una persona del equipo te acompaña paso a paso.</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-verde-oscuro hover:bg-piedra focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amarillo">
        Necesito que un asesor me ayude a inscribirme
      </a>
    </div>
  );
}
