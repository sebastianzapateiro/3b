"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, botonPrincipal, campo, CampoClave, etiqueta } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

export function FormIngresar({ destino }: { destino: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    setCargando(true);
    setError("");
    const listo = `/ingreso/listo?destino=${encodeURIComponent(destino)}`;
    const { error } = await authClient.signIn.email({
      email: String(datos.get("correo")),
      password: String(datos.get("clave")),
      // Better Auth navega aquí al ingresar; también es el destino del enlace si reenvía la verificación.
      callbackURL: listo,
    });
    if (error) {
      setError(mensajeDeError(error));
      setCargando(false);
      return;
    }
    router.replace(listo);
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
        <input id="correo" name="correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" required className={campo} />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="clave" className={etiqueta}>Clave</label>
          <Link href="/recuperar" className="text-sm font-semibold text-verde hover:text-verde-oscuro">¿La olvidaste?</Link>
        </div>
        <CampoClave id="clave" autoComplete="current-password" />
      </div>
      {error && <Aviso tono="error">{error}</Aviso>}
      <button type="submit" disabled={cargando} className={`mt-1.5 ${botonPrincipal}`}>
        {cargando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
