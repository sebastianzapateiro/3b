import { Aviso } from "@/components/cuenta";
import { negocioEditable, whatsappParaCampo } from "@/lib/alta-proveedor";
import { exigirProveedor, perfilEditable } from "@/lib/panel";
import { guardarNegocioPanel, guardarPerfil } from "../actions";

/** P8 · Perfil del proveedor (CU-34) y, en borrador, datos del negocio del alta (CU-30). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";
const chip = "flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-borde-campo px-4 text-sm has-[:checked]:border-verde has-[:checked]:bg-verde has-[:checked]:font-semibold has-[:checked]:text-white";
const tarjeta = "flex scroll-mt-24 flex-col gap-5 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";

export default async function PerfilPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor: p } = await exigirProveedor();
  const sp = await searchParams;
  const borrador = p.estado === "borrador";
  const [e, n] = await Promise.all([perfilEditable(p.id), borrador ? negocioEditable(p.id) : null]);

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      {n && (
        <form id="negocio" action={guardarNegocioPanel} className={tarjeta}>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold">Datos de tu negocio</h2>
            <p className="text-sm text-gris">Mientras tu perfil sea borrador puedes cambiarlos. Después de enviarlo, los revisa el equipo.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombrePublico" className="text-sm font-semibold">Nombre público</label>
            <input id="nombrePublico" name="nombrePublico" required maxLength={80} defaultValue={p.nombre} placeholder="Ej: Plomería Jairo" className={campo} />
            <span className="text-xs text-gris">Así te ven los clientes. Puede ser tu nombre o el de tu negocio.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="whatsapp" className="text-sm font-semibold">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" required defaultValue={whatsappParaCampo(p.whatsapp)} placeholder="300 123 4567" className={`${campo} sm:max-w-64`} />
            <span className="text-xs text-gris">Aquí te escriben los clientes.</span>
          </div>
          <fieldset className="flex flex-col gap-2 text-[15px]">
            <legend className="mb-1 text-sm font-semibold">¿Cómo trabajas?</legend>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_sin_rut" required defaultChecked={p.segmento === "independiente_sin_rut"} className="size-5 accent-verde" />Independiente, todavía sin RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_con_rut" defaultChecked={p.segmento === "independiente_con_rut"} className="size-5 accent-verde" />Independiente con RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="empresa" defaultChecked={p.segmento === "empresa"} className="size-5 accent-verde" />Empresa</label>
          </fieldset>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-semibold">¿Qué oficio ofreces? <span className="font-normal text-gris">(hasta 3)</span></legend>
            <div className="flex flex-wrap gap-2">
              {n.oficios.map((o) => (
                <label key={o.id} className={chip}>
                  <input type="checkbox" name="categoria" value={o.id} defaultChecked={n.elegidos.has(o.id)} className="size-4 accent-white" />
                  {o.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-semibold">Dirección de tu página</label>
            <div className="flex h-13 items-center rounded-campo border-[1.5px] border-borde-campo bg-white pl-4 sm:max-w-md">
              <span className="font-mono text-sm text-gris">lastresb.com.co/</span>
              <input id="slug" name="slug" required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={p.slug} className="h-full min-w-0 flex-1 rounded-r-campo pr-4 font-mono text-sm outline-none" />
            </div>
            <span className="text-xs text-gris">Minúsculas, números y guiones. Ej: plomeria-jairo-suba.</span>
          </div>
          <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar datos del negocio</button>
        </form>
      )}

    <form action={guardarPerfil} className={tarjeta}>
      <h2 className="font-display text-2xl font-bold">Tu perfil</h2>

      <div id="sobre" className="flex scroll-mt-24 flex-col gap-1.5">
        <label htmlFor="presentacion" className="text-sm font-semibold">Sobre mí</label>
        <textarea id="presentacion" name="presentacion" rows={4} maxLength={280} defaultValue={p.presentacion ?? ""} placeholder="Años de experiencia, en qué te especializas y cómo trabajas." className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
        <span className="text-xs text-gris">Hasta 280 caracteres.</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="aniosExperiencia" className="text-sm font-semibold">Años de experiencia</label>
        <input id="aniosExperiencia" name="aniosExperiencia" type="number" min={0} max={80} defaultValue={p.aniosExperiencia ?? ""} className={`${campo} sm:max-w-40`} />
      </div>

      <fieldset id="localidades" className="flex scroll-mt-24 flex-col gap-2.5">
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
        <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="atiendeUrgencias" defaultChecked={p.atiendeUrgencias} className="size-5 accent-verde" />Atiendo urgencias el mismo día</label>
        <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="disponible24h" defaultChecked={p.disponible24h} className="size-5 accent-verde" />Atiendo 24 horas, incluidos fines de semana y festivos</label>
        <label className="flex min-h-11 items-start gap-2.5 py-2"><input type="checkbox" name="visitaAConvenir" defaultChecked={p.visitaAConvenir} className="mt-0.5 size-5 flex-none accent-verde" /><span>Visita a convenir<span className="block text-sm text-gris">No publico precio de visita: lo acordamos por WhatsApp antes de ir. Así apareces en el filtro «A convenir con el proveedor».</span></span></label>
        <p className="text-sm text-gris">Estas etiquetas las declaras tú y se muestran en tu tarjeta. LasTresB no presta el servicio ni garantiza tiempos de llegada.</p>
      </fieldset>

      {!borrador && <div className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
        <b>Categorías:</b> {e.categorias.join(", ") || "—"}. <b>Dirección de tu página:</b> <span className="font-mono">lastresb.com.co/{p.slug}</span>. Para cambiar tus categorías o tu dirección escríbenos desde la página de reclamos: el equipo debe revisarlo.
      </div>}

      <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar cambios</button>
    </form>
    </div>
  );
}
