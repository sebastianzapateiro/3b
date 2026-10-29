"use client";

import { useState } from "react";
import { Aviso, botonPrincipal, CampoClave, etiqueta } from "@/components/cuenta";
import { authClient } from "@/lib/auth-client";

/** Cambio de clave desde Mi cuenta (cierra las demás sesiones). */
export function FormClave() {
  const [estado, setEstado] = useState<{ tono: "error" | "exito"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cambiar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = new FormData(form);
    setCargando(true);
    setEstado(null);
    const { error } = await authClient.changePassword({
      currentPassword: String(datos.get("actual")),
      newPassword: String(datos.get("nueva")),
      revokeOtherSessions: true,
    });
    setCargando(false);
    if (error) return setEstado({ tono: "error", texto: error.code === "INVALID_PASSWORD" ? "La clave actual no coincide." : "No pudimos cambiar la clave. Revisa los datos e intenta de nuevo." });
    form.reset();
    setEstado({ tono: "exito", texto: "Listo, cambiaste tu clave. Cerramos tus otras sesiones." });
  }

  return (
    <form onSubmit={cambiar} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5"><label htmlFor="actual" className={etiqueta}>Clave actual</label><CampoClave id="actual" autoComplete="current-password" placeholder="Tu clave actual" /></div>
      <div className="flex flex-col gap-1.5"><label htmlFor="nueva" className={etiqueta}>Clave nueva</label><CampoClave id="nueva" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} /></div>
      {estado && <Aviso tono={estado.tono}>{estado.texto}</Aviso>}
      <button type="submit" disabled={cargando} className={`${botonPrincipal} self-start px-8`}>{cargando ? "Guardando…" : "Cambiar clave"}</button>
    </form>
  );
}
