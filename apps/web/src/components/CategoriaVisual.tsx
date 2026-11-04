import type { CategoriaPadre } from "@las3b/shared";

/** Colores e íconos de las categorías (P2, CU-03). Compartido por el Home y /categorias. */
export const TONO_CATEGORIA: Record<CategoriaPadre["icono"], string> = {
  casa: "bg-verde-claro text-verde-oscuro",
  libro: "bg-amarillo-suave text-amarillo-oscuro",
  camion: "bg-ladrillo-suave text-ladrillo-oscuro",
  herramienta: "bg-piedra text-tinta",
  huella: "bg-amarillo-suave text-amarillo-oscuro",
  maletin: "bg-verde-claro text-verde-oscuro",
  carro: "bg-piedra text-tinta",
};

const TRAZOS: Record<CategoriaPadre["icono"], React.ReactNode> = {
  casa: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  libro: (
    <>
      <path d="M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z" />
      <path d="M20 5h-4a2 2 0 0 0-2 2" />
      <path d="M20 5v13h-6" />
    </>
  ),
  camion: (
    <>
      <path d="M2 7h11v9H2z" />
      <path d="M13 10h4l4 3v3h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  herramienta: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  huella: (
    <>
      <circle cx="6" cy="11" r="1.8" />
      <circle cx="10" cy="6.5" r="1.8" />
      <circle cx="15" cy="6.5" r="1.8" />
      <circle cx="19" cy="11" r="1.8" />
      <path d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.6 1.4 2.3 2.9 2.3 1 0 1.6-.4 2.6-.4s1.6.4 2.6.4c1.5 0 2.9-.7 2.9-2.3C17.5 15 15 12 12 12z" />
    </>
  ),
  carro: (
    <>
      <path d="M5 16V11l2-5h10l2 5v5" />
      <path d="M3 16h18v3H3z" />
      <path d="M7 11h10" />
    </>
  ),
  maletin: (
    <>
      <path d="M3 8h18v11H3z" />
      <path d="M9 8V5h6v3" />
      <path d="M3 13h18" />
    </>
  ),
};

export function IconoCategoria({ icono, className, grosor = 2 }: { icono: CategoriaPadre["icono"]; className?: string; grosor?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[icono]}
    </svg>
  );
}
