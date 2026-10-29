"use client";

/**
 * P3 / P8 · Carga de un documento privado (regla 2): pide una URL firmada, sube el archivo directo al bucket
 * `privado` y confirma con el servidor, que valida el tipo real. Nunca muestra ni guarda la ruta del archivo.
 */
import { useId, useState } from "react";

export type DocumentoRequerido = {
  tipo: string;
  nombre: string;
  antesDeEnviar: boolean;
  ayuda?: string;
  cargado: { mime: string; bytes: number } | null;
};

const ACEPTA = ".jpg,.jpeg,.png,.heic,.pdf,image/jpeg,image/png,image/heic,application/pdf";
const POR_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", pdf: "application/pdf" };
const FORMATO: Record<string, string> = { "image/jpeg": "JPG", "image/png": "PNG", "image/heic": "HEIC", "application/pdf": "PDF" };

const tamano = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Algunos navegadores no reconocen HEIC y dejan `type` vacío: se deduce por la extensión. */
function mimeDe(archivo: File) {
  if (FORMATO[archivo.type]) return archivo.type;
  return POR_EXTENSION[archivo.name.split(".").pop()?.toLowerCase() ?? ""] ?? archivo.type;
}

async function json(r: Response) {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error ?? "No pudimos subir el archivo. Intenta de nuevo.");
  return d;
}

export function CargaDocumento({ doc, onCargado }: { doc: DocumentoRequerido; onCargado?: (tipo: string, cargado: { mime: string; bytes: number }) => void }) {
  const id = useId();
  const [cargado, setCargado] = useState(doc.cargado);
  const [estado, setEstado] = useState<"quieto" | "subiendo">("quieto");
  const [error, setError] = useState("");

  async function subir(archivo: File) {
    setError("");
    setEstado("subiendo");
    try {
      const mime = mimeDe(archivo);
      const { camino, url } = (await json(
        await fetch("/api/v1/yo/documentos/subida", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: doc.tipo, mime, bytes: archivo.size }) }),
      )) as { camino: string; url: string };
      const subida = await fetch(url, { method: "PUT", headers: { "Content-Type": mime }, body: archivo });
      if (!subida.ok) throw new Error("No pudimos subir el archivo. Revisa tu conexión e intenta de nuevo.");
      const listo = (await json(
        await fetch("/api/v1/yo/documentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: doc.tipo, camino }) }),
      )) as { mime: string; bytes: number };
      setCargado({ mime: listo.mime, bytes: listo.bytes });
      onCargado?.(doc.tipo, { mime: listo.mime, bytes: listo.bytes });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos subir el archivo.");
    } finally {
      setEstado("quieto");
    }
  }

  return (
    <div className={`flex flex-col gap-2 rounded-campo border-[1.5px] p-3.5 ${cargado ? "border-verde bg-verde-claro/40" : "border-borde-campo bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">
            {doc.nombre}
            {doc.antesDeEnviar ? <span className="font-normal text-gris"> · obligatorio</span> : <span className="font-normal text-gris"> · opcional</span>}
          </span>
          <span className={`text-[13px] ${cargado ? "font-semibold text-verde-oscuro" : "text-gris"}`}>
            {estado === "subiendo" ? "Subiendo…" : cargado ? `Cargado · ${FORMATO[cargado.mime] ?? "archivo"} · ${tamano(cargado.bytes)}` : (doc.ayuda ?? "JPG, PNG, HEIC o PDF hasta 10 MB")}
          </span>
        </div>
        <label htmlFor={id} className={`flex h-10 flex-none cursor-pointer items-center rounded-xl border-[1.5px] border-borde-campo bg-white px-3.5 text-sm font-semibold text-tinta ${estado === "subiendo" ? "pointer-events-none opacity-60" : ""}`}>
          {cargado ? "Cambiar" : "Subir"}
        </label>
        <input
          id={id}
          type="file"
          accept={ACEPTA}
          className="sr-only"
          disabled={estado === "subiendo"}
          aria-label={`Subir ${doc.nombre}`}
          onChange={(e) => {
            const archivo = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (archivo) void subir(archivo);
          }}
        />
      </div>
      {error && <p role="alert" className="text-[13px] font-semibold text-ladrillo-oscuro">{error}</p>}
    </div>
  );
}
