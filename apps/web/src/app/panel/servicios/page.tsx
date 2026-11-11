import { redirect } from "next/navigation";
import { serviciosSugeridos } from "@las3b/shared";
import { rutaAlta } from "@/lib/alta-proveedor";
import { Aviso } from "@/components/cuenta";
import { CamposServicio } from "@/components/panel/CamposServicio";
import { exigirProveedor, serviciosDelProveedor } from "@/lib/panel";
import { oficiosDelProveedor } from "@/lib/precios";
import { actualizarServicio, agregarServicio, quitarServicio } from "../actions";

/** P8 · Servicios y precios orientativos (CU-35). Mockup: docs/mockups/Panel_proveedor.md. */
export const metadata = { title: "Servicios y precios" };

export default async function ServiciosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; bienvenida?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  if (proveedor.estado === "borrador") redirect(rutaAlta(sp));
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
            <CamposServicio oficios={oficios} sugeridos={sugeridos} s={{ nombre: s.nombre, descripcion: s.descripcion, precioDesde: s.precioDesde, unidad: s.unidad, categoriaId: s.categoriaId }} />
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
        <CamposServicio oficios={oficios} sugeridos={sugeridos} />
        <button type="submit" className="h-11 self-start rounded-xl bg-verde px-5 text-sm font-semibold text-white">Agregar servicio</button>
      </form>
    </div>
  );
}
