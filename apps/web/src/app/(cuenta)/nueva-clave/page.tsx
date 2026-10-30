"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Aviso, botonPrincipal, CampoClave, Encabezado, etiqueta } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

/** P1 · Nueva clave desde el enlace del correo (RF-20). Revoca las demás sesiones (auth.ts). */
export default function NuevaClave() {
  return (
    <>
      <title>Nueva clave · LasTresB</title>
      <Encabezado titulo="Crea una clave nueva" texto="Usa al menos 8 caracteres. Cerraremos tus otras sesiones por seguridad." />
      <div className="mt-7">
        <Suspense>
          <FormNuevaClave />
        </Suspense>
      </div>
    </>
  );
}

function FormNuevaClave() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState(params.get("error") ? mensajeDeError({ code: "INVALID_TOKEN" }) : "");
  const [cargando, setCargando] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso tono="error">{error || "Este enlace no es válido. Pide uno nuevo."}</Aviso>
        <Link href="/recuperar" className={botonPrincipal}>Pedir otro enlace</Link>
      </div>
    );
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    if (datos.get("clave") !== datos.get("confirmacion")) return setError("Las dos claves no coinciden.");
    setCargando(true);
    setError("");
    const { error } = await authClient.resetPassword({ newPassword: String(datos.get("clave")), token: token! });
    if (error) {
      setCargando(false);
      return setError(mensajeDeError(error));
    }
    // Las invitaciones traen a dónde seguir (p. ej. /panel/confirmar para un proveedor registrado por el equipo).
    const destino = params.get("destino");
    router.replace(`/ingreso?${new URLSearchParams({ clave: "nueva", ...(destino?.startsWith("/") && !destino.startsWith("//") ? { destino } : {}) })}`);
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clave" className={etiqueta}>Clave nueva</label>
        <CampoClave id="clave" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmacion" className={etiqueta}>Repite la clave</label>
        <CampoClave id="confirmacion" autoComplete="new-password" placeholder="La misma de arriba" minLength={8} />
      </div>
      {error && <Aviso tono="error">{error}</Aviso>}
      <button type="submit" disabled={cargando} className={`mt-1.5 ${botonPrincipal}`}>
        {cargando ? "Guardando…" : "Guardar clave"}
      </button>
    </form>
  );
}
