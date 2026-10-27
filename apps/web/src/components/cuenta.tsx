"use client";
/** Piezas compartidas de los formularios de cuenta (Login_movil). */
import Link from "next/link";
import { useState } from "react";
import { authClient, mensajeDeError } from "@/lib/auth-client";

export const campo =
  "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base text-tinta placeholder:text-gris/70";
export const etiqueta = "text-sm font-semibold";
export const botonPrincipal =
  "flex h-[54px] items-center justify-center rounded-campo bg-tinta text-[17px] font-semibold text-white disabled:opacity-60";

export function Encabezado({ titulo, texto }: { titulo: string; texto: React.ReactNode }) {
  return (
    <div className="mt-7 flex flex-col gap-2 lg:mt-0">
      <h1 className="font-display text-[32px] font-extrabold leading-[1.1] tracking-[-1px]">{titulo}</h1>
      <p className="text-base leading-normal text-tinta-2">{texto}</p>
    </div>
  );
}

export function CampoClave({
  id,
  autoComplete,
  placeholder = "Tu clave",
  minLength,
}: {
  id: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex h-13 items-center rounded-campo border-[1.5px] border-borde-campo bg-white pl-4 pr-1.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-amarillo">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required
        className="min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-gris/70"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
        aria-pressed={visible}
        className="flex size-11 items-center justify-center text-gris"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}

export function Aviso({ tono, children }: { tono: "error" | "exito"; children: React.ReactNode }) {
  return (
    <p
      role={tono === "error" ? "alert" : "status"}
      className={`rounded-campo px-4 py-3 text-[15px] leading-snug ${
        tono === "error" ? "bg-ladrillo-suave text-ladrillo-oscuro" : "bg-verde-claro text-verde-oscuro"
      }`}
    >
      {children}
    </p>
  );
}

export function BotonGoogle({ destino }: { destino: string }) {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={cargando}
        onClick={async () => {
          setCargando(true);
          const { error } = await authClient.signIn.social({ provider: "google", callbackURL: destino });
          if (error) {
            setError(mensajeDeError(error));
            setCargando(false);
          }
        }}
        className="flex h-13 items-center justify-center gap-2.5 rounded-campo border-[1.5px] border-borde-campo bg-white text-base font-semibold text-tinta disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
        </svg>
        Continuar con Google
      </button>
      {error && <Aviso tono="error">{error}</Aviso>}
    </>
  );
}

export function Separador() {
  return (
    <div className="mb-5 mt-6 flex items-center gap-3 text-sm text-gris">
      <span className="h-px flex-1 bg-borde" />o con tu correo<span className="h-px flex-1 bg-borde" />
    </div>
  );
}

export function BannerProveedor() {
  return (
    <Link
      href="/proveedores/registro"
      className="mt-auto flex items-center gap-3 rounded-[18px] bg-amarillo-suave p-4 text-tinta lg:mt-8"
    >
      <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-amarillo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
        </svg>
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <b className="text-[15px]">¿Ofreces servicios?</b>
        <span className="text-sm text-amarillo-oscuro">Regístrate gratis como proveedor</span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
