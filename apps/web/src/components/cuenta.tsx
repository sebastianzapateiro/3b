"use client";
/** Piezas compartidas de los formularios de cuenta (Login_movil). */
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

/** Ingreso con Google o Apple. Siempre vuelve a /ingreso/listo, que confirma la cuenta nueva antes de dejarla lista. */
export function BotonSocial({ proveedor, destino, alElegir }: { proveedor: "google" | "apple"; destino: string; alElegir?: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const listo = `/ingreso/listo?destino=${encodeURIComponent(destino)}`;
  return (
    <>
      <button
        type="button"
        disabled={cargando}
        onClick={async () => {
          setCargando(true);
          await alElegir?.();
          const { error } = await authClient.signIn.social({ provider: proveedor, callbackURL: listo, newUserCallbackURL: listo, errorCallbackURL: "/ingreso?error=oauth" });
          if (error) {
            setError(mensajeDeError(error));
            setCargando(false);
          }
        }}
        className="flex h-13 items-center justify-center gap-2.5 rounded-campo border-[1.5px] border-borde-campo bg-white text-base font-semibold text-tinta disabled:opacity-60"
      >
        {proveedor === "google" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.600-2.800-1.800-3.400-1.800-1.400-.1-2.800.9-3.500.9-.7 0-1.800-.8-3-.8-1.500 0-3 .9-3.800 2.300-1.600 2.800-.4 7 1.200 9.300.8 1.100 1.700 2.400 2.900 2.300 1.200 0 1.600-.7 3-.7s1.800.7 3 .7 2-1.100 2.800-2.200c.9-1.300 1.200-2.500 1.300-2.600-.1 0-2.500-1-2.500-3.900zM14.100 5.700c.6-.8 1.100-1.900.9-3-.9 0-2.100.6-2.700 1.400-.6.700-1.100 1.800-1 2.900 1.100.1 2.200-.5 2.800-1.300z" />
          </svg>
        )}
        {proveedor === "google" ? "Continuar con Google" : "Continuar con Apple"}
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

