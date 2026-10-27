"use client";
import Link from "next/link";
import { useState } from "react";
import { Aviso, botonPrincipal, campo, Encabezado, etiqueta } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

/** P1 · Recuperar clave (RF-20). La respuesta es la misma exista o no la cuenta. */
export default function Recuperar() {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function pedirEnlace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError("");
    const { error } = await authClient.requestPasswordReset({
      email: String(new FormData(e.currentTarget).get("correo")),
      redirectTo: "/nueva-clave",
    });
    setCargando(false);
    if (error) return setError(mensajeDeError(error));
    setEnviado(true);
  }

  return (
    <>
      <title>Recuperar clave · Las 3B</title>
      <Encabezado titulo="¿Olvidaste tu clave?" texto="Escribe tu correo y te enviamos un enlace para crear una nueva." />
      <div className="mt-7">
        {enviado ? (
          <div className="flex flex-col gap-4">
            <Aviso tono="exito">Si hay una cuenta con ese correo, te llegará el enlace en unos minutos. Vence en 1 hora.</Aviso>
            <Link href="/ingresar" className={botonPrincipal}>Volver a ingresar</Link>
          </div>
        ) : (
          <form onSubmit={pedirEnlace} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
              <input id="correo" name="correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" required className={campo} />
            </div>
            {error && <Aviso tono="error">{error}</Aviso>}
            <button type="submit" disabled={cargando} className={`mt-1.5 ${botonPrincipal}`}>
              {cargando ? "Enviando…" : "Enviarme el enlace"}
            </button>
            <Link href="/ingresar" className="mt-2 text-center text-[15px] font-semibold text-verde hover:text-verde-oscuro">
              Volver a ingresar
            </Link>
          </form>
        )}
      </div>
    </>
  );
}
