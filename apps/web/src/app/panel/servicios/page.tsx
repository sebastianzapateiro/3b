import { Aviso } from "@/components/cuenta";
import { exigirProveedor, serviciosDelProveedor } from "@/lib/panel";
import { oficiosDelProveedor, PRECIO_A_CONVENIR_PROVEEDOR } from "@/lib/precios";
import { actualizarServicio, agregarServicio, quitarServicio } from "../actions";

/** P8 · Servicios y precios orientativos (CU-35). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const UNIDADES = [["visita", "Por visita"], ["hora", "Por hora"], ["clase", "Por clase"], ["metro2", "Por m²"], ["trayecto", "Por trayecto"], ["trabajo", "Por trabajo"]] as const;

type Oficio = { id: number; nombre: string; sinPrecio: boolean };

/** Con un solo oficio, el precio depende de él; con varios, de cuál elija el servicio (Aseo no lleva precio). */
function Campos({ s, oficios }: { s?: { nombre: string; descripcion: string | null; precioDesde: string | null; unidad: string; categoriaId: number | null }; oficios: Oficio[] }) {
  const varios = oficios.length > 1;
  const oficio = oficios.length === 1 ? oficios[0] : oficios.find((o) => o.id === s?.categoriaId);
  const sinPrecio = oficio?.sinPrecio ?? false;
  return (
    <div className={`grid gap-3 ${sinPrecio ? "" : "sm:grid-cols-[2fr_1fr_1fr]"}`}>
      {varios && (
        <div className="flex flex-col gap-1.5 sm:col-span-3"><label className="text-sm font-semibold">Oficio</label>
          <select name="categoriaId" defaultValue={s?.categoriaId ?? oficios[0]!.id} className={campo}>{oficios.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
          {oficios.some((o) => o.sinPrecio) && <span className="text-[13px] text-gris">En Aseo y limpieza el precio es «{PRECIO_A_CONVENIR_PROVEEDOR.toLowerCase()}»: no se guarda valor.</span>}
        </div>
      )}
      <div className="flex flex-col gap-1.5 sm:col-span-3"><label className="text-sm font-semibold">Servicio</label><input name="nombre" required defaultValue={s?.nombre} placeholder={sinPrecio ? "Ej: Aseo de apartamento" : "Ej: Visita de diagnóstico"} className={campo} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Detalle <span className="font-normal text-gris">(opcional)</span></label><input name="descripcion" defaultValue={s?.descripcion ?? ""} maxLength={140} placeholder={sinPrecio ? "Incluye ventanas y cocina" : "Incluye revisión de fugas"} className={campo} /></div>
      {sinPrecio ? (
        <p className="text-sm font-semibold text-tinta-2">Precio: {PRECIO_A_CONVENIR_PROVEEDOR}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Precio desde</label><input name="precio" inputMode="numeric" defaultValue={s?.precioDesde ?? ""} placeholder="$ valor" className={campo} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold">Por</label><select name="unidad" defaultValue={s?.unidad ?? "visita"} className={campo}>{UNIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
        </>
      )}
    </div>
  );
}

export default async function ServiciosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  const [lista, oficios] = await Promise.all([serviciosDelProveedor(proveedor.id), oficiosDelProveedor(proveedor.id)]);
  const sinPrecio = oficios.length > 0 && oficios.every((o) => o.sinPrecio);

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">
        {sinPrecio
          ? "En tu página el precio aparece como «a convenir con el proveedor»: el valor lo acuerdas directamente con cada cliente."
          : "Los precios son orientativos: el valor final lo acuerdas con cada cliente. Se muestran en tu página como «desde»."}
      </p>

      {lista.map((s) => (
        <div key={s.id} className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5">
          <form action={actualizarServicio} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={s.id} />
            <Campos oficios={oficios} s={{ nombre: s.nombre, descripcion: s.descripcion, precioDesde: s.precioDesde, unidad: s.unidad, categoriaId: s.categoriaId }} />
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
        <Campos oficios={oficios} />
        <button type="submit" className="h-11 self-start rounded-xl bg-verde px-5 text-sm font-semibold text-white">Agregar servicio</button>
      </form>
    </div>
  );
}
