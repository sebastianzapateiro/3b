"use client";

/** Foto de perfil opcional y pública: se sube con URL firmada y el servidor la recorta a un cuadrado WebP. */
import { useId, useState } from "react";
import { useRouter } from "next/navigation";

const POR_EXTENSION: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
const mimeDe = (a: File) => (a.type === "image/jpeg" || a.type === "image/png" ? a.type : POR_EXTENSION[a.name.split(".").pop()?.toLowerCase() ?? ""] ?? a.type);

async function json(r: Response) {
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error ?? "No pudimos subir la foto. Intenta de nuevo.");
  return d;
}

export function CargaFotoPerfil({ actual, iniciales, maxMb, quitar }: { actual: string | null; iniciales: string; maxMb: number; quitar: (f: FormData) => void | Promise<void> }) {
  const id = useId();
  const router = useRouter();
  const [autoriza, setAutoriza] = useState(false);
  const [estado, setEstado] = useState<"quieto" | "subiendo">("quieto");
  const [mensaje, setMensaje] = useState<{ tono: "ok" | "error"; texto: string } | null>(null);

  async function subir(archivo: File) {
    setMensaje(null);
    setEstado("subiendo");
    try {
      const mime = mimeDe(archivo);
      const { camino, url } = (await json(await fetch("/api/v1/yo/fotos/subida", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mime, bytes: archivo.size, perfil: true }) }))) as { camino: string; url: string };
      const subida = await fetch(url, { method: "PUT", headers: { "Content-Type": mime }, body: archivo });
      if (!subida.ok) throw new Error("No pudimos subir la foto. Revisa tu conexión e intenta de nuevo.");
      await json(await fetch("/api/v1/yo/fotos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ camino, declaraAutoria: autoriza, perfil: true }) }));
      setMensaje({ tono: "ok", texto: "Listo, ya tienes foto de perfil." });
    } catch (e) {
      setMensaje({ tono: "error", texto: e instanceof Error ? e.message : "No pudimos subir la foto." });
    } finally {
      setEstado("quieto");
      router.refresh();
    }
  }

  const bloqueado = !autoriza || estado === "subiendo";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {actual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actual} alt="Tu foto de perfil" className="size-20 flex-none rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="flex size-20 flex-none items-center justify-center rounded-full bg-piedra font-display text-2xl font-bold text-tinta-2">{iniciales}</span>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor={id} className={`flex h-11 cursor-pointer items-center rounded-xl bg-verde px-5 text-sm font-semibold text-white ${bloqueado ? "pointer-events-none opacity-50" : ""}`}>
            {estado === "subiendo" ? "Subiendo…" : actual ? "Cambiar foto" : "Subir mi foto"}
          </label>
          {actual && (
            <form action={quitar}><button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-ladrillo-oscuro">Quitar</button></form>
          )}
        </div>
      </div>
      <label className="flex min-h-11 items-start gap-2.5 py-1 text-[15px]">
        <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} className="mt-0.5 size-5 flex-none accent-verde" />
        <span>Soy yo en la foto y autorizo que se muestre públicamente a los clientes.</span>
      </label>
      <p className="text-[13px] text-gris">JPG o PNG, hasta {maxMb} MB. Una foto tuya, de frente y con buena luz.</p>
      <input
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        disabled={bloqueado}
        aria-label="Subir foto de perfil"
        onChange={(e) => {
          const archivo = e.currentTarget.files?.[0];
          e.currentTarget.value = "";
          if (archivo) void subir(archivo);
        }}
      />
      {mensaje && <p role={mensaje.tono === "error" ? "alert" : "status"} className={`text-[13px] font-semibold ${mensaje.tono === "error" ? "text-ladrillo-oscuro" : "text-verde-oscuro"}`}>{mensaje.texto}</p>}
    </div>
  );
}
