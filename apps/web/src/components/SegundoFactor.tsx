"use client";

/**
 * A0 / B1 · Segundo factor (2FA TOTP) al ingresar, compartido por /ingresar y /admin/ingresar.
 * Acepta el código de 6 dígitos de la app autenticadora o, si se perdió el celular, un código de respaldo.
 */
import { useRef, useState } from "react";
import { Aviso, botonPrincipal, campo } from "@/components/cuenta";
import { authClient } from "@/lib/auth-client";

const celda = "h-[60px] w-0 flex-1 rounded-xl border-[1.5px] border-borde-campo bg-white text-center text-2xl font-bold text-tinta focus:border-2 focus:border-tinta";

/** Seis casillas para el código; acepta pegar el código completo. */
export function CeldasCodigo({ digitos, onChange, autoCompletar = false }: { digitos: string[]; onChange: (d: string[]) => void; autoCompletar?: boolean }) {
  const celdas = useRef<(HTMLInputElement | null)[]>([]);

  function escribir(i: number, valor: string) {
    const limpio = valor.replace(/\D/g, "");
    if (limpio.length > 1) {
      const nuevo = limpio.slice(0, 6).split("");
      onChange([...nuevo, ...Array(6 - nuevo.length).fill("")]);
      celdas.current[Math.min(nuevo.length, 5)]?.focus();
      return;
    }
    onChange(digitos.map((x, j) => (j === i ? limpio : x)));
    if (limpio && i < 5) celdas.current[i + 1]?.focus();
  }

  return (
    <fieldset className="flex gap-2">
      <legend className="sr-only">Código de 6 dígitos</legend>
      {digitos.map((d, i) => (
        <input
          key={i}
          ref={(el) => { celdas.current[i] = el; }}
          aria-label={`Dígito ${i + 1}`}
          inputMode="numeric"
          autoComplete={autoCompletar && i === 0 ? "one-time-code" : "off"}
          value={d}
          onChange={(e) => escribir(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) celdas.current[i - 1]?.focus(); }}
          className={celda}
        />
      ))}
    </fieldset>
  );
}

/** Paso del código tras la clave. `onVerificado` decide a dónde ir; `onVolver` regresa al paso de la clave. */
export function PasoSegundoFactor({ onVerificado, onVolver }: { onVerificado: () => void; onVolver: () => void }) {
  const [respaldo, setRespaldo] = useState(false);
  const [digitos, setDigitos] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function verificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const trustDevice = datos.get("confiar") === "on";
    const code = respaldo ? String(datos.get("respaldo") ?? "").trim() : digitos.join("");
    if (!respaldo && code.length !== 6) return setError("Escribe los 6 dígitos del código.");
    if (respaldo && !code) return setError("Escribe uno de tus códigos de respaldo.");
    setCargando(true);
    setError("");
    const { error } = respaldo
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice });
    if (error) {
      setCargando(false);
      return setError(
        error.status === 429
          ? "Demasiados intentos. Espera un momento y vuelve a intentar."
          : respaldo ? "Ese código de respaldo no es válido o ya se usó." : "El código no es válido o venció. Revisa tu app autenticadora.",
      );
    }
    onVerificado();
  }

  return (
    <form onSubmit={verificar} className="flex flex-col gap-4">
      {respaldo ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="respaldo" className="text-sm font-semibold">Código de respaldo</label>
          <input id="respaldo" name="respaldo" autoComplete="off" spellCheck={false} placeholder="Ej: a1b2c-3d4e5" className={`${campo} font-mono`} />
          <span className="text-[13px] text-gris">Cada código de respaldo sirve una sola vez.</span>
        </div>
      ) : (
        <CeldasCodigo digitos={digitos} onChange={setDigitos} autoCompletar />
      )}
      <label className="flex items-center gap-2.5 text-sm text-tinta-2"><input type="checkbox" name="confiar" className="size-[18px] accent-verde" />Confiar en este equipo por 8 horas</label>
      {error && <Aviso tono="error">{error}</Aviso>}
      <button type="submit" disabled={cargando} className={botonPrincipal}>{cargando ? "Verificando…" : "Verificar e ingresar"}</button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <button type="button" onClick={onVolver} className="font-semibold text-tinta-2">Volver</button>
        <button type="button" onClick={() => { setRespaldo(!respaldo); setError(""); }} className="font-semibold text-verde hover:text-verde-oscuro">
          {respaldo ? "Usar el código de la app" : "¿Perdiste el celular? Usa un código de respaldo"}
        </button>
      </div>
    </form>
  );
}
