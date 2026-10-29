import { Aviso } from "@/components/cuenta";
import { exigirProveedor, serviciosDelProveedor } from "@/lib/panel";
import { actualizarServicio, agregarServicio, quitarServicio } from "../actions";

/** P8 · Servicios y precios orientativos (CU-35). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const UNIDADES = [["visita", "Por visita"], ["hora", "Por hora"], ["clase", "Por clase"], ["metro2", "Por m²"], ["trayecto", "Por trayecto"], ["trabajo", "Por trabajo"]] as const;

function Campos({ s }: { s?: { nombre: string; descripcion: string | null; precioDesde: string | null; unidad: string } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
      <div className="flex flex-col gap-1.5 sm:col-span-3"><label className="text-sm font-semibold">Servicio</label><input name="nombre" required defaultValue={s?.nombre} placeholder="Ej: Visita de diagnóstico" className={campo} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Detalle <span className="font-normal text-gris">(opcional)</span></label><input name="descripcion" defaultValue={s?.descripcion ?? ""} maxLength={140} placeholder="Incluye revisión de fugas" className={campo} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Precio desde</label><input name="precio" inputMode="numeric" defaultValue={s?.precioDesde ?? ""} placeholder="$ valor" className={campo} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Por</label><select name="unidad" defaultValue={s?.unidad ?? "visita"} className={campo}>{UNIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
    </div>
  );
}

export default async function ServiciosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  const lista = await serviciosDelProveedor(proveedor.id);

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">Los precios son orientativos: el valor final lo acuerdas con cada cliente. Se muestran en tu página como «desde».</p>

      {lista.map((s) => (
        <div key={s.id} className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5">
          <form action={actualizarServicio} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={s.id} />
            <Campos s={{ nombre: s.nombre, descripcion: s.descripcion, precioDesde: s.precioDesde, unidad: s.unidad }} />
            <button type="submit" className="h-11 self-start rounded-xl bg-tinta px-5 text-sm font-semibold text-white">Guardar</button>
          </form>
          <form action={quitarServicio}>
            <input type="hidden" name="id" value={s.id} />
            <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-ladrillo-oscuro">Quitar este servicio</button>
          </form>
        </div>
      ))}

      <form action={agregarServicio} className="flex flex-col gap-3 rounded-[22px] border-2 border-dashed border-borde-campo p-5">
        <h2 className="font-display text-xl font-bold">Agregar un servicio</h2>
        <Campos />
        <button type="submit" className="h-11 self-start rounded-xl bg-verde px-5 text-sm font-semibold text-white">Agregar servicio</button>
      </form>
    </div>
  );
}
