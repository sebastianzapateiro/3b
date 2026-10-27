"use client";
import Link from "next/link";
import { useState } from "react";
import { Aviso, botonPrincipal, campo, CampoClave, etiqueta } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

const casilla = "mt-0.5 size-5 flex-none accent-verde";

export function FormRegistro() {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviadoA, setEnviadoA] = useState("");

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const correo = String(datos.get("correo"));
    setCargando(true);
    setError("");
    const { error } = await authClient.signUp.email({
      name: String(datos.get("nombre")).trim(),
      email: correo,
      password: String(datos.get("clave")),
      declaraMayorDeEdad: datos.get("mayorDeEdad") === "on",
      // Lo valida y registra el servidor (hooks de auth.ts → consentimientos).
      ...({ aceptaPoliticas: datos.get("politicas") === "on" } as object),
      callbackURL: "/ingresar?verificado=1",
    });
    setCargando(false);
    if (error) return setError(mensajeDeError(error));
    setEnviadoA(correo);
  }

  if (enviadoA) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso tono="exito">
          Te enviamos un enlace a <b>{enviadoA}</b>. Ábrelo para confirmar tu correo y luego ingresa.
        </Aviso>
        <p className="text-[15px] leading-normal text-tinta-2">¿No te llegó? Revisa la carpeta de spam o intenta ingresar: te lo enviamos de nuevo.</p>
        <Link href="/ingresar" className={botonPrincipal}>Ir a ingresar</Link>
      </div>
    );
  }

  return (
    <form onSubmit={registrar} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className={etiqueta}>Nombre</label>
        <input id="nombre" name="nombre" autoComplete="name" placeholder="Como quieres que te vean en tus reseñas" required className={campo} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
        <input id="correo" name="correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" required className={campo} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="clave" className={etiqueta}>Clave</label>
        <CampoClave id="clave" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} />
      </div>

      {/* RF-19: casillas no premarcadas. */}
      <label className="mt-1 flex items-start gap-3 text-[15px] leading-snug">
        <input type="checkbox" name="mayorDeEdad" required className={casilla} />
        Declaro que soy mayor de edad.
      </label>
      <label className="flex items-start gap-3 text-[15px] leading-snug">
        <input type="checkbox" name="politicas" required className={casilla} />
        <span>
          Acepto los{" "}
          <Link href="/terminos" target="_blank" className="font-semibold text-verde underline">términos de uso</Link> y autorizo el{" "}
          <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">tratamiento de mis datos personales</Link>.
        </span>
      </label>

      {error && <Aviso tono="error">{error}</Aviso>}
      <button type="submit" disabled={cargando} className={`mt-1.5 ${botonPrincipal}`}>
        {cargando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
