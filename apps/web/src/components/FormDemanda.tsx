import Link from "next/link";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";
import { registrarSolicitud } from "@/app/servicios/actions";
import { AvisoSolicitud } from "@/components/AvisoSolicitud";

const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";

/**
 * Formulario corto de demanda sin cubrir. Con `oficio` pregunta solo por localidad y WhatsApp («avísame cuando haya»);
 * sin `oficio` pide también qué servicio se busca («cuéntanos»).
 */
export function FormDemanda({ oficio, oficioNombre, localidad, retorno, titulo }: { oficio?: string; oficioNombre?: string; localidad?: string; retorno: string; titulo: string }) {
  return (
    <section id="demanda" className="flex scroll-mt-24 flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold">{titulo}</h2>
      <AvisoSolicitud />
      {(
        <form action={registrarSolicitud} className="flex flex-col gap-3">
          <input type="hidden" name="retorno" value={retorno} />
          {oficio ? (
            <input type="hidden" name="oficio" value={oficio} />
          ) : (
            <div className="flex flex-col gap-1.5"><label htmlFor="d-texto" className="text-sm font-semibold">¿Qué servicio necesitas?</label><input id="d-texto" name="texto" maxLength={300} placeholder="Ej: arreglo de persianas" className={campo} /></div>
          )}
          {oficioNombre && <p className="text-[15px] text-tinta-2">Servicio: <b>{oficioNombre}</b></p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="d-localidad" className="text-sm font-semibold">Localidad</label>
              <select id="d-localidad" name="localidad" defaultValue={localidad ?? ""} className={campo}>
                <option value="">Cualquiera</option>
                {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5"><label htmlFor="d-whatsapp" className="text-sm font-semibold">Tu WhatsApp <span className="font-normal text-gris">(opcional)</span></label><input id="d-whatsapp" name="whatsapp" type="tel" placeholder="300 000 0000" className={campo} /></div>
          </div>
          <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2"><input type="checkbox" name="autoriza" className="mt-0.5 size-[18px] accent-verde" />Autorizo que usen mi WhatsApp para avisarme, según la <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</Link>. Solo es necesario si dejaste el número.</label>
          <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="d-web">No llenar</label><input id="d-web" name="web" tabIndex={-1} autoComplete="off" /></div>
          <button type="submit" className="h-[52px] self-start rounded-campo bg-tinta px-7 text-base font-semibold text-white">Enviar</button>
        </form>
      )}
    </section>
  );
}
