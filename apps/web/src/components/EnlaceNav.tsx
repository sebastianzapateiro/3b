"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Enlace del menú principal: el ítem activo se marca con subrayado y color de texto (no con recuadro). */
export function EnlaceNav({ href, children, prefijos = [] }: { href: string; children: React.ReactNode; prefijos?: string[] }) {
  const ruta = usePathname();
  const activo = ruta === href || [href, ...prefijos].some((p) => p !== "/" && ruta.startsWith(`${p}/`));
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex h-11 items-center px-3.5 text-[15px] font-medium underline-offset-[10px] ${activo ? "font-semibold text-verde-oscuro underline decoration-2" : "text-tinta hover:text-verde-oscuro"}`}
    >
      {children}
    </Link>
  );
}