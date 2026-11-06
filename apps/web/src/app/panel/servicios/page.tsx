import { serviciosSugeridos } from "@las3b/shared";
import { Aviso } from "@/components/cuenta";
import { SelectorServicio } from "@/components/panel/SelectorServicio";
import { exigirProveedor, serviciosDelProveedor } from "@/lib/panel";
import { oficiosDelProveedor, PRECIO_A_CONVENIR_PROVEEDOR } from "@/lib/precios";
import { actualizarServicio, agregarServicio, quitarServicio } from "../actions";

/** P8 · Servicios y precios orientativos (CU-35). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const UNIDADES = [["visita", "Por visita"], ["hora", "Por hora"], ["clase", "Por clase"], ["metro2", "Por m²"], ["trayecto", "Por trayecto"], ["trabajo", "Por trabajo"]] as const;

type Oficio = { id: number; nombre: string; slug: string; sinPrecio: boolean };

/** Con un solo oficio, el precio depende de él; con varios, de cuál elija el servicio (Aseo no lleva precio). */
function Campos({ s, oficios, sugeridos }: { s?: { nombre: string; descripcion: string | null; precioDesde: string | null; unidad: string; categoriaId: number | null }; oficios: Oficio[]; sugeridos: Record<number, string[]> }) {
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

export const metadata = { title: "Servicios y precios" };

export default async function ServiciosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; bienvenida?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  const [lista, oficios] = await Promise.all([serviciosDelProveedor(proveedor.id), oficiosDelProveedor(proveedor.id)]);
  const sinPrecio = oficios.length > 0 && oficios.every((o) => o.sinPrecio);
  const sugeridos = Object.fromEntries(oficios.map((o) => [o.id, serviciosSugeridos(o.slug)]));

  return (
    <div className="flex flex-col gap-5">
      {sp.bienvenida === "1" && <Aviso tono="exito">¡Listo, tu perfil ya existe! Ahora crea tus servicios: lo que haces dentro de cada oficio y su precio desde. Con uno ya puedes seguir; el resto del perfil lo completas después.</Aviso>}
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">
        {sinPrecio
          ? "En tu página el precio aparece como «a convenir con el proveedor»: el valor lo acuerdas directamente con cada cliente."
          : "Los precios son orientativos: el valor final lo acuerdas con cada cliente. Se muestran en tu página como «desde»."}
      </p>

      {oficios.length === 0 && <Aviso tono="error">Primero elige tus oficios en el paso «Tus oficios»: cada servicio va dentro de uno de ellos.</Aviso>}

      {oficios.length > 1 && <p className="text-sm text-gris">Tienes {oficios.length} oficios: <b className="text-tinta">{oficios.map((o) => o.nombre).join(", ")}</b>. Cada servicio se agrega dentro de uno de ellos.</p>}

      {lista.slice().sort((x, y) => (x.categoriaId ?? 0) - (y.categoriaId ?? 0)).map((s) => (
        <div key={s.id} className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5">
          <form action={actualizarServicio} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={s.id} />
            <Campos oficios={oficios} sugeridos={sugeridos} s={{ nombre: s.nombre, descripcion: s.descripcion, precioDesde: s.precioDesde, unidad: s.unidad, categoriaId: s.categoriaId }} />
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
        <p className="-mt-1 text-sm text-gris">Un oficio puede tener varios servicios, por ejemplo «Visita de diagnóstico» o «Instalación».</p>
        <Campos oficios={oficios} sugeridos={sugeridos} />
        <button type="submit" className="h-11 self-start rounded-xl bg-verde px-5 text-sm font-semibold text-white">Agregar servicio</button>
      </form>
    </div>
  );
}
