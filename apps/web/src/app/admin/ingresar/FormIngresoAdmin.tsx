"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Aviso, botonPrincipal, campo, CampoClave, etiqueta } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

/** B1 · Ingreso al backoffice en dos pasos: clave y código TOTP. Mockup: docs/mockups/BO_Ingreso.dc.html. */
export function FormIngresoAdmin() {
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2 | "config">(1);
  const [configuracion, setConfiguracion] = useState<{ uri: string; clave: string; qr: string; respaldo: string[] } | null>(null);
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [digitos, setDigitos] = useState<string[]>(Array(6).fill(""));
  const celdas = useRef<(HTMLInputElement | null)[]>([]);

  async function paso1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    setCargando(true);
    setError("");
    const correoIngresado = String(datos.get("correo"));
    const { data, error } = await authClient.signIn.email({ email: correoIngresado, password: String(datos.get("clave")) });
    setCargando(false);
    if (error) return setError(mensajeDeError(error));
    if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      setCorreo(correoIngresado);
      return setPaso(2);
    }
    // Sin 2FA no hay acceso al backoffice. Si la cuenta tiene rol de equipo, se configura aquí; si no, se cierra la sesión.
    const clave = String(datos.get("clave"));
    const yo = await fetch("/api/v1/yo").then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!yo?.backoffice) {
      await authClient.signOut();
      return setError("Esta cuenta no tiene acceso al backoffice.");
    }
    setCargando(true);
    const { data: config, error: errorConfig } = await authClient.twoFactor.enable({ password: clave });
    setCargando(false);
    if (errorConfig || !config || !("totpURI" in config)) {
      await authClient.signOut();
      return setError("No pudimos iniciar la configuración del segundo factor. Intenta de nuevo.");
    }
    setCorreo(correoIngresado);
    const qr = await QRCode.toDataURL(config.totpURI, { width: 220, margin: 1, color: { dark: "#1B2623", light: "#FFFFFF" } });
    setConfiguracion({ uri: config.totpURI, clave: new URL(config.totpURI).searchParams.get("secret") ?? "", qr, respaldo: config.backupCodes });
    setPaso("config");
  }

  async function confirmarConfiguracion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = digitos.join("");
    if (code.length !== 6) return setError("Escribe los 6 dígitos que muestra tu app.");
    setCargando(true);
    setError("");
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    if (error) {
      setCargando(false);
      return setError("El código no coincide. Revisa que hayas escaneado el QR y que la hora del celular sea automática.");
    }
    router.replace("/admin");
    router.refresh();
  }

  async function paso2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const code = digitos.join("");
    if (code.length !== 6) return setError("Escribe los 6 dígitos del código.");
    setCargando(true);
    setError("");
    const { error } = await authClient.twoFactor.verifyTotp({ code, trustDevice: datos.get("confiar") === "on" });
    if (error) {
      setCargando(false);
      return setError("El código no es válido o venció. Revisa tu app autenticadora.");
    }
    router.replace("/admin");
    router.refresh();
  }

  function escribir(i: number, valor: string) {
    const limpio = valor.replace(/\D/g, "");
    if (limpio.length > 1) {
      // Pegar el código completo.
      const nuevo = limpio.slice(0, 6).split("");
      setDigitos([...nuevo, ...Array(6 - nuevo.length).fill("")]);
      celdas.current[Math.min(nuevo.length, 5)]?.focus();
      return;
    }
    setDigitos((d) => d.map((x, j) => (j === i ? limpio : x)));
    if (limpio && i < 5) celdas.current[i + 1]?.focus();
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-6">
      <div role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={paso === 1 ? 1 : 2} aria-label="Pasos de ingreso" className="flex gap-1.5">
        <span className={`h-1.5 flex-1 rounded-[3px] ${"bg-verde"}`} />
        <span className={`h-1.5 flex-1 rounded-[3px] ${paso === 2 ? "bg-verde" : "bg-borde"}`} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gris">Paso {paso === 1 ? 1 : 2} de 2</span>
        <h1 className="font-display text-[34px] font-extrabold leading-[1.1] tracking-[-1px]">{paso === 1 ? "Ingresa a tu cuenta" : paso === "config" ? "Configura tu segundo factor" : "Código de verificación"}</h1>
        <p className="text-base leading-normal text-tinta-2">
          {paso === 1 ? "Usa el correo y la clave de tu cuenta de LasTresB." : paso === "config" ? "Es la primera vez que entras al backoffice: vincula una app autenticadora (Google Authenticator, Authy, 1Password…)." : <>Abre tu app autenticadora y escribe el código de LasTresB para <b>{correo}</b>.</>}
        </p>
      </div>

      {paso === "config" && configuracion ? (
        <form onSubmit={confirmarConfiguracion} className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3 text-[15px] leading-normal text-tinta-2">
            <li>
              <b>1.</b> En tu app elige «Agregar cuenta» y escanea este código QR:
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el cliente */}
              <img src={configuracion.qr} alt="Código QR para vincular LasTresB en tu app autenticadora" width={220} height={220} className="mx-auto mt-3 rounded-xl border border-borde bg-white p-2" />
              <details className="mt-2 text-sm">
                <summary className="inline-flex min-h-11 items-center font-semibold text-tinta-2">¿No puedes escanearlo?</summary>
                <span className="block">Elige «Ingresar clave manualmente» y escribe:</span>
                <code className="mt-1.5 block break-all rounded-xl bg-white px-3 py-2.5 font-mono text-base font-bold tracking-wider text-tinta">{configuracion.clave}</code>
                <a href={configuracion.uri} className="mt-1 inline-flex min-h-11 items-center font-semibold text-verde">Abrir en mi app autenticadora (desde el celular)</a>
              </details>
            </li>
            <li><b>2.</b> Guarda estos códigos de respaldo en un lugar seguro. Cada uno sirve una sola vez:
              <code className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-white px-3 py-2.5 font-mono text-sm">{configuracion.respaldo.map((c) => <span key={c}>{c}</span>)}</code>
            </li>
            <li><b>3.</b> Escribe el código de 6 dígitos que muestra la app para confirmar:</li>
          </ol>
          <fieldset className="flex gap-2">
            <legend className="sr-only">Código de 6 dígitos</legend>
            {digitos.map((d, i) => (
              <input key={i} ref={(el) => { celdas.current[i] = el; }} aria-label={`Dígito ${i + 1}`} inputMode="numeric" autoComplete="off" value={d} onChange={(e) => escribir(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) celdas.current[i - 1]?.focus(); }} className="h-[60px] w-0 flex-1 rounded-xl border-[1.5px] border-borde-campo bg-white text-center text-2xl font-bold text-tinta focus:border-2 focus:border-tinta" />
            ))}
          </fieldset>
          {error && <Aviso tono="error">{error}</Aviso>}
          <button type="submit" disabled={cargando} className={botonPrincipal}>{cargando ? "Verificando…" : "Activar y entrar"}</button>
        </form>
      ) : paso === 1 ? (
        <form onSubmit={paso1} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="correo" className={etiqueta}>Correo electrónico</label>
            <input id="correo" name="correo" type="email" autoComplete="email" required className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="clave" className={etiqueta}>Clave</label>
            <CampoClave id="clave" autoComplete="current-password" />
          </div>
          {error && <Aviso tono="error">{error}</Aviso>}
          <button type="submit" disabled={cargando} className={botonPrincipal}>{cargando ? "Verificando…" : "Continuar"}</button>
        </form>
      ) : (
        <form onSubmit={paso2} className="flex flex-col gap-4">
          <fieldset className="flex gap-2">
            <legend className="sr-only">Código de 6 dígitos</legend>
            {digitos.map((d, i) => (
              <input
                key={i}
                ref={(el) => { celdas.current[i] = el; }}
                aria-label={`Dígito ${i + 1}`}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                value={d}
                onChange={(e) => escribir(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) celdas.current[i - 1]?.focus(); }}
                className="h-[60px] w-0 flex-1 rounded-xl border-[1.5px] border-borde-campo bg-white text-center text-2xl font-bold text-tinta focus:border-2 focus:border-tinta"
              />
            ))}
          </fieldset>
          <label className="flex items-center gap-2.5 text-sm text-tinta-2"><input type="checkbox" name="confiar" className="size-[18px] accent-verde" />Confiar en este equipo por 8 horas</label>
          {error && <Aviso tono="error">{error}</Aviso>}
          <button type="submit" disabled={cargando} className={botonPrincipal}>{cargando ? "Verificando…" : "Verificar e ingresar"}</button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <button type="button" onClick={() => { setPaso(1); setError(""); setDigitos(Array(6).fill("")); }} className="font-semibold text-tinta-2">Volver al paso 1</button>
          </div>
        </form>
      )}

      <p className="rounded-[14px] bg-amarillo-suave px-4 py-3.5 text-sm leading-normal text-amarillo-oscuro">
        Tras varios intentos fallidos la cuenta se bloquea temporalmente.
      </p>
    </div>
  );
}
