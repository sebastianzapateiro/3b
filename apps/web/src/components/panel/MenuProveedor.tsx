"use client";

/**
 * P8 · Menú lateral del panel del proveedor, con el mismo lenguaje del backoffice (MenuAdmin).
 * Muestra el avance del perfil y, mientras es borrador, qué secciones tienen pasos pendientes.
 * En móvil es una barra superior con un botón de menú (hamburguesa) que despliega las secciones.
 */
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AnilloAvance } from "./Avance";

export type MarcaSeccion = "ok" | "pendiente" | "bloqueado" | undefined;

type Item = { href: string; texto: string; icono: React.ReactNode; marca?: MarcaSeccion; numero?: number };

const trazo = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Icono = ({ children }: { children: React.ReactNode }) => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...trazo}>{children}</svg>;

function Abriendo() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin text-[#C9D1CF]" aria-label="Abriendo" role="img" {...trazo}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </svg>
  );
}

function Marca({ marca, numero }: { marca: MarcaSeccion; numero?: number }) {
  if (marca === "ok") return <span className="flex size-5 items-center justify-center rounded-full bg-verde text-[11px] font-bold text-white" aria-label="Completo">✓</span>;
  if (marca === "pendiente") return <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amarillo px-1.5 text-[11px] font-bold text-tinta" aria-label="Pendiente">{numero ?? "!"}</span>;
  if (marca === "bloqueado") return <span className="text-[11px] font-semibold uppercase text-[#8C9A96]">Al final</span>;
  return null;
}

export type PropsMenuProveedor = {
  nombre: string;
  slug: string;
  estado: { texto: string; clase: string };
  avance: { porcentaje: number; texto: string };
  marcas: { perfil?: MarcaSeccion; servicios?: MarcaSeccion; fotos?: MarcaSeccion; verificacion?: MarcaSeccion; confirmar?: MarcaSeccion };
  pendientes: { perfil?: number; servicios?: number; fotos?: number; verificacion?: number };
  borrador: boolean;
  publicado: boolean;
  resenasSinResponder: number;
};

export function MenuProveedor(p: PropsMenuProveedor) {
  const ruta = usePathname();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  // Al elegir una sección el menú se cierra.
  useEffect(() => setAbierto(false), [ruta]);

  const grupos: { titulo?: string; items: Item[] }[] = [
    { items: [{ href: "/panel", texto: "Resumen", icono: <Icono><path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 8h6V4h-6z" /></Icono> }] },
    {
      titulo: "Tu perfil",
      items: [
        // En borrador todo el alta es una sola página; ya enviado, cada tema tiene su pantalla.
        ...(p.borrador
          ? [{ href: "/panel/alta", texto: "Completar mi perfil", marca: p.marcas.perfil === "pendiente" || p.marcas.servicios === "pendiente" || p.marcas.fotos === "pendiente" || p.marcas.verificacion === "pendiente" ? ("pendiente" as const) : ("ok" as const), numero: (p.pendientes.perfil ?? 0) + (p.pendientes.servicios ?? 0) + (p.pendientes.fotos ?? 0) + (p.pendientes.verificacion ?? 0), icono: <Icono><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></Icono> }]
          : [
            { href: "/panel/perfil", texto: "Perfil y negocio", marca: p.marcas.perfil, numero: p.pendientes.perfil, icono: <Icono><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></Icono> },
            { href: "/panel/servicios", texto: "Servicios y precios", marca: p.marcas.servicios, numero: p.pendientes.servicios, icono: <Icono><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" /></Icono> },
            { href: "/panel/fotos", texto: "Fotos de trabajos", marca: p.marcas.fotos, numero: p.pendientes.fotos, icono: <Icono><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 8" /></Icono> },
            { href: "/panel/verificacion", texto: "Verificación", marca: p.marcas.verificacion, numero: p.pendientes.verificacion, icono: <Icono><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="m9 12 2 2 4-4" /></Icono> },
          ]),
        ...(p.borrador ? [{ href: "/panel/confirmar", texto: "Publicar", marca: p.marcas.confirmar, icono: <Icono><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></Icono> }] : []),
      ],
    },
    ...(!p.borrador
      ? [{
          titulo: "Clientes",
          items: [
            { href: "/panel/contactos", texto: "Contactos", icono: <Icono><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></Icono> },
            { href: "/panel/resenas", texto: "Reseñas", marca: p.resenasSinResponder > 0 ? ("pendiente" as const) : undefined, numero: p.resenasSinResponder, icono: <Icono><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></Icono> },
          ],
        }]
      : []),
  ];

  const activo = (href: string) => (href === "/panel" ? ruta === "/panel" : ruta.startsWith(href));

  return (
    <aside className="flex flex-col gap-3 bg-tinta px-3.5 py-3.5 text-crema lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:flex-none lg:gap-5 lg:overflow-y-auto lg:py-5">
      <div className="flex items-center justify-between gap-3 px-2">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
          LasTres<span className="text-ladrillo-claro">B</span>
          <span className="text-sm font-semibold text-[#C9D1CF]">Proveedor</span>
        </Link>
        {/* En móvil: avance y botón de menú junto al logo. */}
        <span className="flex items-center gap-2.5 lg:hidden">
          <AnilloAvance porcentaje={p.avance.porcentaje} tamano={36} grosor={5} claro />
          <button
            type="button"
            aria-expanded={abierto}
            aria-controls="menu-proveedor"
            onClick={() => setAbierto((a) => !a)}
            className="flex h-11 items-center gap-2 rounded-[10px] bg-white/10 px-3 text-sm font-semibold text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...trazo}>{abierto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            Menú
          </button>
        </span>
      </div>

      <div className="hidden flex-col gap-3 rounded-xl bg-white/6 p-3.5 lg:flex">
        <div className="flex items-center gap-3">
          <AnilloAvance porcentaje={p.avance.porcentaje} tamano={60} grosor={6} claro />
          <div className="flex min-w-0 flex-col gap-0.5">
            <b className="truncate text-sm text-white">{p.nombre}</b>
            <span className="truncate font-mono text-[11px] text-[#A9B4B1]">/{p.slug}</span>
          </div>
        </div>
        <span className="text-[13px] leading-snug text-[#C9D1CF]">{p.avance.texto}</span>
        <span className={`flex h-[22px] items-center self-start rounded-full px-2 text-xs font-bold ${p.estado.clase}`}>{p.estado.texto}</span>
      </div>

      <nav id="menu-proveedor" aria-label="Panel de proveedor" className={`${abierto ? "flex" : "hidden"} flex-col gap-0.5 text-[15px] lg:flex`}>
        {grupos.map((g, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {g.titulo && <span className="px-3 pb-1.5 pt-3 text-xs font-bold uppercase tracking-[1px] text-[#8C9A96]">{g.titulo}</span>}
            {g.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-current={activo(it.href) ? "page" : undefined}
                className={`flex h-11 flex-none items-center gap-2.5 rounded-[10px] px-3 ${activo(it.href) ? "bg-white/12 font-semibold text-white" : "text-[#DDE3E1] hover:bg-white/6"}`}
              >
                {it.icono}
                {it.texto}
                <span className="ml-auto flex items-center gap-2 pl-1">
                  <Abriendo />
                  <Marca marca={it.marca} numero={it.numero} />
                </span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className={`mt-auto ${abierto ? "flex" : "hidden"} flex-col gap-1 rounded-xl bg-white/6 px-3 py-3 text-[13px] lg:flex`}>
        {p.publicado && <Link href={`/${p.slug}`} className="py-1 font-semibold text-crema">Ver mi página pública</Link>}
        <Link href="/cuenta" className="py-1 font-semibold text-crema">Mi cuenta</Link>
        <Link href="/" className="py-1 font-semibold text-crema">Ir a LasTresB</Link>
        <button
          type="button"
          disabled={saliendo}
          onClick={async () => {
            setSaliendo(true);
            await authClient.signOut();
            router.replace("/");
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
