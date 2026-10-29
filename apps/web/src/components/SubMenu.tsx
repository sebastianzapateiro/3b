"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pestañas de segundo nivel para Mi cuenta y el Panel del proveedor: mantienen corto el menú principal. */
export function SubMenu({ items, etiqueta }: { items: { href: string; texto: string }[]; etiqueta: string }) {
  const ruta = usePathname();
  const activo = (href: string) => (items.some((i) => i.href !== href && i.href.startsWith(href) && ruta.startsWith(i.href)) ? false : ruta === href || ruta.startsWith(`${href}/`));

  return (
    <nav aria-label={etiqueta} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={activo(i.href) ? "page" : undefined}
          className={`flex h-11 flex-none items-center rounded-full px-4 text-[15px] ${activo(i.href) ? "bg-tinta font-semibold text-white" : "border-[1.5px] border-borde-campo bg-white font-medium text-tinta"}`}
        >
          {i.texto}
        </Link>
      ))}
    </nav>
  );
}
