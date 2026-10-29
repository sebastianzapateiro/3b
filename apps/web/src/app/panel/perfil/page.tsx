import { Aviso } from "@/components/cuenta";
import { exigirProveedor, perfilEditable } from "@/lib/panel";
import { guardarPerfil } from "../actions";

/** P8 · Perfil público del proveedor (CU-34). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";

export default async function PerfilPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor: p } = await exigirProveedor();
  const sp = await searchParams;
  const e = await perfilEditable(p.id);

  return (
    <form action={guardarPerfil} className="flex flex-col gap-5 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold">Tu perfil</h2>
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="presentacion" className="text-sm font-semibold">Sobre mí</label>
        <textarea id="presentacion" name="presentacion" rows={4} maxLength={280} defaultValue={p.presentacion ?? ""} placeholder="Años de experiencia, en qué te especializas y cómo trabajas." className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
        <span className="text-xs text-gris">Hasta 280 caracteres.</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="aniosExperiencia" className="text-sm font-semibold">Años de experiencia</label>
        <input id="aniosExperiencia" name="aniosExperiencia" type="number" min={0} max={80} defaultValue={p.aniosExperiencia ?? ""} className={`${campo} sm:max-w-40`} />
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-semibold">Localidades donde trabajas</legend>
        <div className="flex flex-wrap gap-2">
          {e.localidades.map((l) => (
            <label key={l.id} className="flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-borde-campo px-4 text-sm has-[:checked]:border-verde has-[:checked]:bg-verde has-[:checked]:font-semibold has-[:checked]:text-white">
              <input type="checkbox" name="localidad" value={l.id} defaultChecked={e.localidadesElegidas.has(l.id)} className="size-4 accent-white" />
              {l.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5 text-[15px]">
        <legend className="mb-1 text-sm font-semibold">Cómo trabajas</legend>
        <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="emiteFactura" defaultChecked={Boolean(p.emiteFactura)} className="size-5 accent-verde" />Emito factura</label>
        <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="ofreceGarantia" defaultChecked={Boolean(p.ofreceGarantia)} className="size-5 accent-verde" />Ofrezco garantía por mi trabajo</label>
      </fieldset>

      <div className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
        <b>Categorías:</b> {e.categorias.join(", ") || "—"}. <b>Dirección de tu página:</b> <span className="font-mono">lastresb.com.co/{p.slug}</span>. Para cambiar tus categorías o tu dirección escríbenos desde la página de reclamos: el equipo debe revisarlo.
      </div>

      <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar cambios</button>
    </form>
  );
}
