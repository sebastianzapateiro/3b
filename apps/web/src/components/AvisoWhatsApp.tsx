"use client";

/**
 * P2 · Búsqueda sin proveedores (CU-01, Ley 1581): la persona deja su WhatsApp y el equipo les pide a proveedores cercanos que la contacten.
 * - `existente`: ya hizo la búsqueda desde el inicio (hay solicitud en la cookie): se le agregan los datos con POST /api/v1/solicitudes/datos.
 * - si no: se guarda una solicitud nueva (oficio, localidad, datos y autorización) con POST /api/v1/solicitudes. No redirige.
 */
import Link from "next/link";
import { CampoWhatsapp } from "@/components/CampoWhatsapp";
import { useId, useState } from "react";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";

const campo = "h-12 w-full min-w-0 rounded-campo border-[1.5px] border-borde-campo bg-white px-3 text-base";

type Props = {
  /** Lo que buscó (oficio o texto libre). */
  texto: string;
  localidadInicial: string;
  /** Dónde no se encontró: «tu dirección» (ubicación exacta) o «tu localidad». */
  lugar: "direccion" | "localidad";
  /** La solicitud ya existe (vino del buscador del inicio). */
  existente?: boolean;
};

export function AvisoWhatsApp({ texto, localidadInicial, lugar, existente = false }: Props) {
  const id = useId();
  const [estado, setEstado] = useState<"libre" | "enviando" | "listo">("libre");
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEstado("enviando");
    setError("");
    const datos = { nombre: f.get("nombre"), whatsapp: f.get("whatsapp"), autoriza: f.get("autoriza") === "on", web: f.get("web") };
    try {
      const r = await fetch(existente ? "/api/v1/solicitudes/datos" : "/api/v1/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existente ? datos : { ...datos, texto, ubicacion: "localidad", localidad: f.get("localidad"), origen: "buscar_vacio" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar tus datos. Intenta de nuevo.");
      setEstado("listo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tus datos. Intenta de nuevo.");
      setEstado("libre");
    }
  }

  if (estado === "listo") {
    return <p role="status" className="rounded-xl bg-verde-claro px-3.5 py-3 text-sm font-semibold text-verde-oscuro">Listo. Les pedimos a los proveedores cercanos que te contacten por WhatsApp.</p>;
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl bg-white p-4">
      <b className="text-[15px] leading-snug text-tinta">
        En {lugar === "direccion" ? "tu dirección" : "tu localidad"} no encontré «{texto}», pero sé que hay algunos cerca. Déjame tu WhatsApp y les pediré que te contacten.
      </b>
      <div className={`grid gap-3 ${existente ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <div className="flex min-w-0 flex-col gap-1"><label htmlFor={`${id}-n`} className="text-sm font-semibold text-tinta">Tu nombre</label><input id={`${id}-n`} name="nombre" required maxLength={80} autoComplete="given-name" className={campo} /></div>
        <div className="flex min-w-0 flex-col gap-1"><label htmlFor={`${id}-w`} className="text-sm font-semibold text-tinta">Tu WhatsApp</label><CampoWhatsapp id={`${id}-w`} className={campo} /></div>
        {!existente && (
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={`${id}-l`} className="text-sm font-semibold text-tinta">Localidad</label>
            <select id={`${id}-l`} name="localidad" required defaultValue={localidadInicial} className={campo}>
              {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
            </select>
          </div>
        )}
      </div>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-tinta-2">
        <input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" />
        <span>Acepto los <Link href="/terminos" target="_blank" className="underline">términos de uso</Link> y autorizo el tratamiento de mis datos (nombre, WhatsApp y ubicación) para que me contacten, según la <Link href="/privacidad" target="_blank" className="underline">política de tratamiento de datos</Link>.</span>
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>
      {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
      <button type="submit" disabled={estado === "enviando"} className="min-h-12 self-start rounded-campo bg-tinta px-6 text-[15px] font-semibold text-white disabled:opacity-60">
        {estado === "enviando" ? "Guardando…" : "Que me contacten"}
      </button>
    </form>
  );
}
