/**
 * Iconos de «¿Cómo funciona?». SVG inline que se pintan con las variables CSS --c1 (trazo principal), --c2 (acento) y --c3 (relleno suave),
 * y --ink (detalles internos). Cada panel de color define sus valores.
 */
import type { IconoPaso } from "@/lib/como-funciona.content";

const base = { width: 96, height: 96, viewBox: "0 0 96 96", fill: "none", strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const t = { stroke: "var(--c1)" } as const;

const ICONOS: Record<IconoPaso, React.ReactNode> = {
  lupa: (
    <>
      <circle cx="40" cy="40" r="22" {...t} fill="var(--c3)" />
      <path d="M57 57l22 22" {...t} />
      <path d="M40 28a8 8 0 0 1 8 8c0 6-8 14-8 14s-8-8-8-14a8 8 0 0 1 8-8z" stroke="var(--c2)" fill="var(--c2)" />
      <circle cx="40" cy="36" r="2.5" fill="var(--ink)" stroke="none" />
    </>
  ),
  tarjeta: (
    <>
      <rect x="12" y="22" width="72" height="52" rx="10" {...t} fill="var(--c3)" />
      <circle cx="34" cy="43" r="9" {...t} />
      <path d="M20 66c2-8 8-12 14-12s12 4 14 12" {...t} />
      <path d="M58 38h18M58 48h12" {...t} />
      <circle cx="74" cy="64" r="11" fill="var(--c2)" stroke="none" />
      <path d="M68.500 64l4 4 7-8" stroke="var(--ink)" />
    </>
  ),
  fotos: (
    <>
      <rect x="22" y="12" width="56" height="44" rx="8" {...t} fill="var(--c3)" />
      <rect x="14" y="26" width="56" height="44" rx="8" {...t} fill="var(--c3)" />
      <rect x="8" y="40" width="58" height="46" rx="8" {...t} fill="var(--ink)" fillOpacity=".12" />
      <circle cx="26" cy="56" r="5" fill="var(--c2)" stroke="none" />
      <path d="M12 82l18-18 12 12 8-8 14 14" {...t} />
    </>
  ),
  chat: (
    <>
      <path d="M14 46a30 28 0 1 1 14 24l-14 6 4-13A28 28 0 0 1 14 46z" {...t} fill="var(--c3)" />
      <path d="M32 40h32M32 52h20" {...t} />
      <circle cx="72" cy="70" r="10" fill="var(--c2)" stroke="none" />
      <path d="M67.500 70l3 3 6-6" stroke="var(--ink)" />
    </>
  ),
  estrella: (
    <>
      <path d="M48 12l10.500 21.500 23.500 3.500-17 16.500 4 23.500L48 66l-21 11 4-23.500L14 37l23.500-3.500z" {...t} fill="var(--c3)" />
      <path d="M48 58c-8-5-12-9-12-14a6.500 6.500 0 0 1 12-3 6.500 6.500 0 0 1 12 3c0 5-4 9-12 14z" fill="var(--c2)" stroke="none" />
    </>
  ),
  usuario: (
    <>
      <circle cx="40" cy="32" r="14" {...t} fill="var(--c3)" />
      <path d="M12 82c2-18 14-28 28-28s26 10 28 28" {...t} />
      <circle cx="73" cy="30" r="14" fill="var(--c2)" stroke="none" />
      <path d="M73 23v14M66 30h14" stroke="var(--ink)" />
    </>
  ),
  perfil: (
    <>
      <rect x="12" y="14" width="72" height="68" rx="10" {...t} fill="var(--c3)" />
      <circle cx="34" cy="38" r="9" fill="var(--c2)" stroke="none" />
      <path d="M22 62c1-7 6-10 12-10s11 3 12 10" {...t} />
      <path d="M56 32h18M56 44h18M56 56h10" {...t} />
      <path d="M22 72h52" {...t} strokeOpacity=".5" />
    </>
  ),
  escudo: (
    <>
      <path d="M48 10l30 10v24c0 20-13 34-30 42-17-8-30-22-30-42V20z" {...t} fill="var(--c3)" />
      <path d="M34 48l10 10 20-22" stroke="var(--ink)" strokeWidth={6} />
    </>
  ),
  qr: (
    <>
      <rect x="12" y="12" width="26" height="26" rx="5" {...t} />
      <rect x="58" y="12" width="26" height="26" rx="5" {...t} />
      <rect x="12" y="58" width="26" height="26" rx="5" {...t} />
      <rect x="20" y="20" width="10" height="10" rx="2" fill="var(--c2)" stroke="none" />
      <rect x="66" y="20" width="10" height="10" rx="2" fill="var(--c2)" stroke="none" />
      <rect x="20" y="66" width="10" height="10" rx="2" fill="var(--c2)" stroke="none" />
      <path d="M58 58h8v8h-8zM74 58h10M58 76h14M78 70v14M48 48h8" {...t} />
    </>
  ),
};

export function IconoComo({ icono }: { icono: IconoPaso }) {
  return <svg {...base}>{ICONOS[icono]}</svg>;
}
