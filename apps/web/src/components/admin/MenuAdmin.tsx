"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Item = { href: string; texto: string; icono: React.ReactNode; marca?: number; pronto?: boolean };

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Icono({ children }: { children: React.ReactNode }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...trazo}>{children}</svg>;
}

/** Rueda junto al ítem del menú mientras abre su sección (va dentro del Link: useLinkStatus lo exige). */
function Abriendo() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin text-[#C9D1CF]" aria-label="Abriendo" role="img" {...trazo}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}

const ETIQUETA_ROL: Record<string, string> = { admin: "Admin", moderador: "Moderador", verificador: "Verificador" };

/** Menú lateral del backoffice (mockups BO_*). Moderación, Reclamos y datos y Auditoría se construyen aparte. */
export function MenuAdmin({ nombre, rol, pendientes, reportes, tramites, esAdmin }: { nombre: string; rol: string; pendientes: number; reportes: number; tramites: number; esAdmin: boolean }) {
  const ruta = usePathname();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  const grupos: { titulo?: string; items: Item[] }[] = [
    { items: [{ href: "/admin", texto: "Tablero", icono: <Icono><path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 8h6V4h-6z" /></Icono> }] },
    {
      titulo: "Operación",
      items: [
        { href: "/admin/aprobaciones", texto: "Aprobaciones", marca: pendientes, icono: <Icono><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 11l2 2 4-4" /></Icono> },
        { href: "/admin/moderacion", texto: "Moderación", marca: reportes, icono: <Icono><path d="M5 21V4h12l-2 4 2 4H5" /></Icono> },
      ],
    },
    {
      titulo: "Cumplimiento",
      items: [
        { href: "/admin/cumplimiento", texto: "Reclamos y datos", marca: tramites, icono: <Icono><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></Icono> },
        { href: "/admin/auditoria", texto: "Auditoría y parámetros", icono: <Icono><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Icono> },
      ],
    },
    ...(esAdmin
      ? [
          {
            titulo: "Administración",
            items: [
              { href: "/admin/usuarios", texto: "Usuarios y roles", icono: <Icono><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.3 2.3 3.5 5.5" /></Icono> },
              { href: "/admin/catalogo", texto: "Catálogo", icono: <Icono><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></Icono> },
            ],
          },
        ]
      : []),
  ];

  const activo = (href: string) => (href === "/admin" ? ruta === "/admin" : ruta.startsWith(href));

  return (
    <aside className="flex flex-col gap-5 bg-tinta px-3.5 py-5 text-crema lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:flex-none lg:overflow-y-auto">
      <span className="flex items-center gap-2 px-2 font-display text-lg font-extrabold">
        LasTres<span className="text-ladrillo-claro">B</span>
        <span className="text-sm font-semibold text-[#C9D1CF]">Backoffice</span>
      </span>
      <nav aria-label="Backoffice" className="flex flex-col gap-0.5 text-[15px]">
        {grupos.map((g, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {g.titulo && <span className="px-3 pb-1.5 pt-3.5 text-xs font-bold uppercase tracking-[1px] text-[#8C9A96]">{g.titulo}</span>}
            {g.items.map((it) =>
              it.pronto ? (
                <span key={it.href} aria-disabled="true" className="flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-[#8C9A96]">
                  {it.icono}{it.texto}
                  <span className="ml-auto text-[11px] font-semibold uppercase">Pronto</span>
                </span>
              ) : (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={activo(it.href) ? "page" : undefined}
                  className={`flex h-11 items-center gap-2.5 rounded-[10px] px-3 ${activo(it.href) ? "bg-white/12 font-semibold text-white" : "text-[#DDE3E1] hover:bg-white/6"}`}
                >
                  {it.icono}{it.texto}
                  <span className="ml-auto flex items-center gap-2">
                    <Abriendo />
                    {it.marca !== undefined && it.marca > 0 && (
                      <span className="flex h-[22px] items-center rounded-full bg-amarillo px-2 text-xs font-bold text-tinta">{it.marca}</span>
                    )}
                  </span>
                </Link>
              ),
            )}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1.5 rounded-xl bg-white/6 px-3 py-3.5 text-[13px]">
        <b className="text-sm">{nombre}</b>
        <span className="flex items-center gap-1.5">
          <span className="flex h-[22px] items-center rounded-full bg-amarillo px-2 font-bold text-tinta">{ETIQUETA_ROL[rol] ?? rol}</span>
          <span className="text-[#A9B4B1]">2FA activo</span>
        </span>
        <button
          type="button"
          disabled={saliendo}
          onClick={async () => {
            setSaliendo(true);
            await authClient.signOut();
            router.replace("/admin/ingresar");
            router.refresh();
          }}
          className="self-start py-1 font-semibold text-crema disabled:text-[#A9B4B1]"
        >
          {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
