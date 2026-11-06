"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Enlace del menú principal: el ítem activo se marca con subrayado y color de texto (no con recuadro). */
/** `evento`: nombre fijo para la analítica de clics (data-evento, ver ClicsAnalitica). */
export function EnlaceNav({ href, children, prefijos = [], evento }: { href: string; children: React.ReactNode; prefijos?: string[]; evento?: string }) {
  const ruta = usePathname();
  const activo = ruta === href || [href, ...prefijos].some((p) => p !== "/" && ruta.startsWith(`${p}/`));
  return (
    <Link
      href={href}
      data-evento={evento}
      aria-current={activo ? "page" : undefined}
      className={`enlace-cabecera flex h-11 items-center px-3.5 text-[15px] font-medium underline-offset-[10px] ${activo ? "font-semibold text-verde-oscuro underline decoration-2" : "text-tinta hover:text-verde-oscuro"}`}
    >
      {children}
    </Link>
  );
}