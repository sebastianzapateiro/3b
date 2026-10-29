import type { CategoriaPadre } from "@las3b/shared";

/** Colores e íconos de las categorías (P2, CU-03). Compartido por el Home y /categorias. */
export const TONO_CATEGORIA: Record<CategoriaPadre["icono"], string> = {
  casa: "bg-verde-claro text-verde-oscuro",
  libro: "bg-amarillo-suave text-amarillo-oscuro",
  camion: "bg-ladrillo-suave text-ladrillo-oscuro",
  herramienta: "bg-piedra text-tinta",
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
};

export function IconoCategoria({ icono, className }: { icono: CategoriaPadre["icono"]; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TRAZOS[icono]}
    </svg>
  );
}
