"use client";

/**
 * A0 · Ayuda en /ingreso (CU-30). Para proveedores la ayuda es el botón flotante; aquí solo queda, para clientes (quienes llegan a calificar),
 * un enlace discreto al WhatsApp del equipo. El número sale de NEXT_PUBLIC_WHATSAPP_AYUDA (ver lib/ayuda-inscripcion.ts).
 */
import { enlaceAyuda } from "@/lib/ayuda-inscripcion";

export function AyudaInscripcion({ tipo }: { tipo: "cliente" | "proveedor" | null }) {
  if (tipo === "cliente") {
    const href = enlaceAyuda("Hola, necesito ayuda para ingresar o crear mi cuenta en LasTresB.");
    if (!href) return null;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center text-center text-sm font-semibold text-verde underline hover:text-verde-oscuro">
        ¿Necesitas ayuda para ingresar? Escríbenos por WhatsApp
      </a>
    );
  }

  // Proveedores: la ayuda es el botón flotante (components/ayuda/AyudaProveedor.tsx), ya no hay tarjeta.
  return null;
}
