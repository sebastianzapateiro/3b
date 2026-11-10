/**
 * Piezas visuales compartidas de «¿Cómo funciona?» (home y /como-funciona): foto del paso con next/image o, si aún no hay foto,
 * un degradado del color del paso con su icono. Los colores salen de los tokens de globals.css; el texto sobre cada degradado cumple AA
 * (blanco sobre verde, ladrillo y tinta; tinta sobre amarillo).
 */
import Image from "next/image";
import type { ColorPanel, IconoPaso, PasoComo } from "@/lib/como-funciona.content";

export const COLOR: Record<ColorPanel, { degradado: string; icono: string; aro: string; numero: string }> = {
  verde: { degradado: "bg-linear-to-br from-verde to-verde-oscuro", icono: "text-white", aro: "ring-verde", numero: "text-verde" },
  ladrillo: { degradado: "bg-linear-to-br from-ladrillo to-ladrillo-oscuro", icono: "text-white", aro: "ring-ladrillo", numero: "text-ladrillo" },
  // El amarillo no contrasta con blanco ni como número sobre crema: icono en tinta y número en amarillo oscuro.
  amarillo: { degradado: "bg-linear-to-br from-amarillo to-amarillo-suave", icono: "text-tinta", aro: "ring-amarillo", numero: "text-amarillo-oscuro" },
  tinta: { degradado: "bg-linear-to-br from-tinta to-tinta-2", icono: "text-white", aro: "ring-tinta", numero: "text-tinta" },
};

const TRAZOS: Record<IconoPaso, React.ReactNode> = {
  lupa: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  tarjeta: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m8 14 1-3 1 3-2.5-1.8h3zM14 10h4M14 14h4" /></>,
  fotos: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.2-4.6A8 8 0 1 1 21 12Z" />,
  estrella: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  perfil: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  escudo: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
  enlace: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
};

export function IconoComo({ icono, className = "size-12" }: { icono: IconoPaso; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[icono]}
    </svg>
  );
}

/** Rellena su contenedor (que debe ser `relative` y con `overflow-hidden`): foto si existe, degradado con icono si no. */
export function MediaPaso({ paso, sizes, tamanoIcono = "size-12" }: { paso: PasoComo; sizes: string; tamanoIcono?: string }) {
  const c = COLOR[paso.color];
  if (paso.imagen) return <Image src={paso.imagen} alt={paso.alt} fill sizes={sizes} className="object-cover" />;
  return (
    <span className={`absolute inset-0 flex items-center justify-center ${c.degradado} ${c.icono}`} role="img" aria-label={paso.alt}>
      <IconoComo icono={paso.icono} className={tamanoIcono} />
    </span>
  );
}
