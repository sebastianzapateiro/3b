"use client";

/**
 * P8 · Carga de fotos de trabajos: pide una URL firmada, sube el original y deja que el servidor lo procese
 * (WebP, sin EXIF/GPS). Exige la casilla de autoría (CU-36), que no viene premarcada. Sirve al proveedor (/api/v1/yo/fotos)
 */
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

const POR_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

function mimeDe(archivo: File) {
  if (archivo.type === "image/jpeg" || archivo.type === "image/png") return archivo.type;
  return POR_EXTENSION[archivo.name.split(".").pop()?.toLowerCase() ?? ""] ?? archivo.type;
}

async function json(r: Response) {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error ?? "No pudimos subir la foto. Intenta de nuevo.");
  return d;
}

export function CargaFotos({ maxMb, quedan, api = "/api/v1/yo/fotos", textoAutoria = "Confirmo que estas fotos son de trabajos hechos por mí y que puedo publicarlas." }: { maxMb: number; quedan: number; api?: string; textoAutoria?: string }) {
  const id = useId();
  const router = useRouter();
  const [autoria, setAutoria] = useState(false);
  const [estado, setEstado] = useState<"quieto" | "subiendo">("quieto");
  const [mensaje, setMensaje] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  async function subir(archivos: File[]) {
    setMensaje(null);
    setEstado("subiendo");
    let subidas = 0;
    try {
      for (const archivo of archivos.slice(0, quedan)) {
        const mime = mimeDe(archivo);
        const { camino, url } = (await json(
          await fetch(`${api}/subida`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mime, bytes: archivo.size }) }),
        )) as { camino: string; url: string };
        const subida = await fetch(url, { method: "PUT", headers: { "Content-Type": mime }, body: archivo });
        if (!subida.ok) throw new Error("No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.");
        await json(await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ camino, declaraAutoria: autoria }) }));
        subidas += 1;
      }
      setMensaje({ tono: "ok", texto: subidas === 1 ? "Foto subida." : `${subidas} fotos subidas.` });
    } catch (e) {
      setMensaje({ tono: "error", texto: e instanceof Error ? e.message : "No pudimos subir la foto." });
    } finally {
      setEstado("quieto");
      router.refresh();
    }
  }

  const bloqueado = !autoria || estado === "subiendo" || quedan <= 0;
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border-2 border-dashed border-borde-campo p-5">
      <label className="flex min-h-11 items-start gap-2.5 py-1 text-[15px]">
        <input type="checkbox" checked={autoria} onChange={(e) => setAutoria(e.target.checked)} className="mt-0.5 size-5 flex-none accent-verde" />
        <span>{textoAutoria}</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={id} className={`flex h-11 items-center rounded-xl bg-verde px-5 text-sm font-semibold text-white ${bloqueado ? "pointer-events-none opacity-50" : ""}`}>
          {estado === "subiendo" ? "Subiendo…" : "Subir fotos"}
        </label>
        <span className="text-[13px] text-gris">JPG o PNG, hasta {maxMb} MB cada una. {quedan > 0 ? `Puedes subir ${quedan} más.` : "Llegaste al máximo."}</span>
      </div>
      <input
        id={id}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        disabled={bloqueado}
        aria-label="Subir fotos de trabajos"
        onChange={(e) => {
          const archivos = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = "";
          if (archivos.length) void subir(archivos);
        }}
      />
      {mensaje && <p role={mensaje.tono === "error" ? "alert" : "status"} className={`text-[13px] font-semibold ${mensaje.tono === "error" ? "text-ladrillo-oscuro" : "text-verde-oscuro"}`}>{mensaje.texto}</p>}
    </div>
  );
}
