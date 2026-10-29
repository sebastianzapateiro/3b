"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Desplegable, itemMenu } from "@/components/Desplegable";
import { authClient } from "@/lib/auth-client";

type Roles = { proveedor: boolean; backoffice: boolean };

/** Ingresar o menú de la persona con sesión: Mi cuenta, Panel de proveedor y Cerrar sesión (todo en un solo desplegable). */
export function MenuUsuario() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [roles, setRoles] = useState<Roles>({ proveedor: false, backoffice: false });
  const usuarioId = data?.user.id;

  useEffect(() => {
    if (!usuarioId) return;
    fetch("/api/v1/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setRoles(j))
      .catch(() => {});
  }, [usuarioId]);

  if (isPending) return <span className="h-11 w-24" aria-hidden="true" />;

  if (!data?.user) {
    return (
      <Link href="/ingresar" className="flex h-11 items-center rounded-xl border-2 border-tinta px-[18px] text-[15px] font-semibold text-tinta max-sm:border-0 max-sm:px-3">
        Ingresar
      </Link>
    );
  }

  const iniciales = data.user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Desplegable
      etiqueta="Menú de tu cuenta"
      alinear="derecha"
      claseBoton="flex h-11 items-center gap-2 rounded-xl border-2 border-tinta pl-1.5 pr-3 text-[15px] font-semibold text-tinta"
      boton={
        <>
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-verde-claro text-[13px] font-bold text-verde-oscuro">{iniciales}</span>
          <span className="hidden max-w-24 truncate sm:inline">{data.user.name.split(" ")[0]}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </>
      }
    >
      <div className="px-3 pb-2 pt-1.5 text-sm text-gris"><b className="block truncate text-tinta">{data.user.name}</b><span className="block truncate">{data.user.email}</span></div>
      {roles.proveedor && <Link role="menuitem" href="/panel" className={itemMenu}>Panel de proveedor</Link>}
      <Link role="menuitem" href="/cuenta" className={itemMenu}>Mi cuenta</Link>
      <Link role="menuitem" href="/cuenta/actividad" className={itemMenu}>Mis contactos y reseñas</Link>
      {roles.backoffice && <Link role="menuitem" href="/admin" className={itemMenu}>Backoffice</Link>}
      <button
        role="menuitem"
        type="button"
        className={`${itemMenu} border-t border-borde-suave`}
        onClick={async () => {
          await authClient.signOut();
          router.replace("/");
          router.refresh();
        }}
      >
        Cerrar sesión
      </button>
    </Desplegable>
  );
}
