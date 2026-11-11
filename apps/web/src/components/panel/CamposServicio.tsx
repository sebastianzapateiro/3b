import { SelectorServicio } from "@/components/panel/SelectorServicio";
import { PRECIO_A_CONVENIR_PROVEEDOR } from "@/lib/precios";

/** P8 · Campos de un servicio y su precio (CU-35). Los usan /panel/servicios y el alta de una sola página (/panel/alta). */
const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const UNIDADES = [["visita", "Por visita"], ["hora", "Por hora"], ["clase", "Por clase"], ["metro2", "Por m²"], ["trayecto", "Por trayecto"], ["trabajo", "Por trabajo"]] as const;

export type OficioServicio = { id: number; nombre: string; slug: string; sinPrecio: boolean };

/** Con un solo oficio, el precio depende de él; con varios, de cuál elija el servicio (Aseo no lleva precio). */
export function CamposServicio({ s, oficios, sugeridos }: { s?: { nombre: string; descripcion: string | null; precioDesde: string | null; unidad: string; categoriaId: number | null }; oficios: OficioServicio[]; sugeridos: Record<number, string[]> }) {
  const varios = oficios.length > 1;
  const oficio = oficios.length === 1 ? oficios[0] : oficios.find((o) => o.id === s?.categoriaId);
  const sinPrecio = oficio?.sinPrecio ?? false;
  return (
    <div className={`grid gap-3 ${sinPrecio ? "" : "sm:grid-cols-[2fr_1fr_1fr]"}`}>
      {!varios && oficio && <p className="text-sm text-gris sm:col-span-3">Oficio: <b className="text-tinta">{oficio.nombre}</b></p>}
      {/* El menú de servicios depende del oficio elegido; con «Otro servicio» se escribe uno propio. */}
      <SelectorServicio oficios={oficios} sugeridos={sugeridos} mostrarOficio={varios} oficioInicial={s?.categoriaId ?? oficios[0]?.id} nombreInicial={s?.nombre ?? ""} claseCampo={campo} />
      {varios && oficios.some((o) => o.sinPrecio) && <span className="text-[13px] text-gris sm:col-span-3">En Aseo y limpieza el precio es «{PRECIO_A_CONVENIR_PROVEEDOR.toLowerCase()}»: no se guarda valor.</span>}
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
