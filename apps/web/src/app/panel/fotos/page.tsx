import { redirect } from "next/navigation";
import { Aviso } from "@/components/cuenta";
import { rutaAlta } from "@/lib/alta-proveedor";
import { CargaFotos } from "@/components/CargaFotos";
import { FOTOS_MINIMAS } from "@/lib/completitud";
import { fotosDelProveedor } from "@/lib/fotos";
import { parametro } from "@/lib/parametros";
import { exigirProveedor } from "@/lib/panel";
import { quitarFotoTrabajo } from "../actions";

/** P8 · Fotos de trabajos (CU-36): llenan el portafolio y llevan el perfil al nivel «destacado». */
export const metadata = { title: "Fotos de trabajos" };

export default async function FotosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  if (proveedor.estado === "borrador") redirect(rutaAlta(sp));
  const [fotos, maxMb, maximo] = await Promise.all([fotosDelProveedor(proveedor.id), parametro("foto_max_mb"), parametro("fotos_max")]);
  const faltan = Math.max(0, FOTOS_MINIMAS - fotos.length);

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">
        {faltan > 0
          ? `Sube al menos ${FOTOS_MINIMAS} fotos de trabajos tuyos para completar tu perfil (te ${faltan === 1 ? "falta 1" : `faltan ${faltan}`}). Las fotos reales de tus trabajos generan confianza.`
          : "Tu portafolio ya tiene las fotos mínimas. Entre más trabajos muestres, más confianza das."}
      </p>

      <CargaFotos maxMb={maxMb} quedan={Math.max(0, maximo - fotos.length)} />

      {fotos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.id} className="flex flex-col gap-1.5">
              <div className="aspect-square overflow-hidden rounded-2xl bg-borde-suave">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.descripcion ?? "Foto de trabajo"} className="size-full object-cover" loading="lazy" />
              </div>
              <form action={quitarFotoTrabajo}>
                <input type="hidden" name="id" value={f.id} />
                <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-ladrillo-oscuro">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
