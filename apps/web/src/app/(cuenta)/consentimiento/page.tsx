"use client";

import { useState } from "react";
import Link from "next/link";
import { Encabezado, Aviso, etiqueta, botonPrincipal } from "@/components/cuenta";
import { authClient, mensajeDeError } from "@/lib/auth-client";

const casilla = "mt-0.5 size-5 flex-none accent-verde";

type Politica = {
  id: number;
  tipo: string;
  version: string;
  contenidoMd: string;
  esencial: boolean;
};

/** P1 pendientes · Consentimiento tras primer ingreso con Google (RF-19, CU-76).
 * Casillas no premarcadas; guarda versión de política, fecha e IP. */
export default function Consentimiento() {
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [aceptadas, setAceptadas] = useState<Record<number, boolean>>({});

  async function cargarPoliticas() {
    const res = await fetch("/api/v1/politicas/vigentes", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudieron cargar las políticas.");
    setPoliticas(await res.json());
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const esencialesNoAceptadas = politicas.filter(
      (p) => p.esencial && !aceptadas[p.id]
    );
    if (esencialesNoAceptadas.length > 0) {
      setError("Debes aceptar las políticas esenciales para continuar.");
      setCargando(false);
      return;
    }

    const tipos = politicas.filter((p) => aceptadas[p.id]).map((p) => p.tipo);

    const res = await fetch("/api/v1/consentimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipos }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "No se pudieron guardar los consentimientos.");
      setCargando(false);
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso tono="exito">
          Gracias. Tus consentimientos quedaron registrados.
        </Aviso>
        <Link href="/" className={botonPrincipal}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <Encabezado
        titulo="Tus datos y tus decisiones"
        texto="Antes de continuar, confirma que eres mayor de edad y acepta nuestras políticas."
      />

      {!politicas.length && (
        <p className="text-sm text-gris">Cargando políticas…</p>
      )}

      <form onSubmit={guardar} className="flex flex-col gap-3.5">
        {politicas.map((p) => (
          <div key={p.tipo} className="flex flex-col gap-2">
            <label className="mt-1 flex items-start gap-3 text-[15px] leading-snug">
              <input
                type="checkbox"
                name={`politica-${p.id}`}
                checked={!!aceptadas[p.id]}
                onChange={(ev) =>
                  setAceptadas((prev) => ({
                    ...prev,
                    [p.id]: ev.target.checked,
                  }))
                }
                required={p.esencial}
                className={casilla}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <b className="text-tinta">{p.tipo.replace(/_/g, " ")} v{p.version}</b>
                <p className="text-xs text-gris/70">
                  {p.contenidoMd.slice(0, 200)}…
                </p>
              </div>
            </label>
          </div>
        ))}

        <label className="mt-1 flex items-start gap-3 text-[15px] leading-snug">
          <input
            type="checkbox"
            name="mayorDeEdad"
            checked={!!aceptadas[-1]}
            onChange={(ev) =>
              setAceptadas((prev) => ({ ...prev, [-1]: ev.target.checked }))
            }
            required
            className={casilla}
          />
          Declaro que soy mayor de edad.
        </label>

        {error && <Aviso tono="error">{error}</Aviso>}
        <button
          type="submit"
          disabled={cargando}
          className={`mt-1.5 ${botonPrincipal}`}
        >
          {cargando ? "Guardando…" : "Aceptar y continuar"}
        </button>
      </form>

      <p className="mt-4 text-center text-[14px] text-gris">
        Las políticas completas están en{" "}
        <Link href="/terminos" className="font-semibold text-verde underline">
          Términos
        </Link>{" "}
        y{" "}
        <Link href="/privacidad" className="font-semibold text-verde underline">
          Datos personales
        </Link>
        .
      </p>
    </>
  );
}
