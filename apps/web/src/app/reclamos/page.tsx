import { Faq } from "@/components/Faq";
import { FAQ_RECLAMOS } from "@/lib/faqs";
import { meta } from "@/lib/seo";
import { presentarReclamo } from "./actions";

export const metadata = meta({ titulo: "Reclamos", descripcion: "Presenta un reclamo sobre un proveedor o un perfil publicado en LasTresB y conoce cómo lo tramitamos.", ruta: "/reclamos" });

const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const fecha = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("es-CO", { dateStyle: "long", timeZone: "UTC" });

/**
 * Reclamos de consumo (CU-10, Ley 1480 art. 53): formulario público + procedimiento.
 * Texto sujeto a revisión legal (ver memoria de pendientes con abogado).
 */
export default async function Reclamos({ searchParams }: { searchParams: Promise<{ proveedor?: string; error?: string; enviado?: string; limite?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-extrabold">Reclamos</h1>
        <p className="mt-4 text-lg leading-relaxed text-tinta-2">Si tuviste un problema con un proveedor que contactaste por LasTresB, cuéntanos. Recibimos tu reclamo, lo tramitamos y, si lo pides, te entregamos los datos de identificación y contacto del proveedor.</p>

        <section id="formulario" className="mt-8 flex scroll-mt-24 flex-col gap-4 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">Presentar un reclamo</h2>
          {sp.enviado ? (
            <p role="status" className="rounded-xl bg-verde-claro p-4 text-[15px] leading-normal text-verde-oscuro"><b>Recibimos tu reclamo, radicado {sp.enviado}.</b> Te responderemos al correo que dejaste a más tardar el {sp.limite ? fecha(sp.limite) : "plazo legal"} (días hábiles).</p>
          ) : (
            <form action={presentarReclamo} className="flex flex-col gap-3.5">
              {sp.error && <p role="alert" className="rounded-xl bg-ladrillo-suave p-3 text-[15px] text-ladrillo-oscuro">{sp.error}</p>}
              <div className="flex flex-col gap-1.5"><label htmlFor="proveedor" className="text-sm font-semibold">Proveedor (enlace de su página)</label><input id="proveedor" name="proveedor" required defaultValue={sp.proveedor ? `lastresb.com.co/${sp.proveedor}` : ""} placeholder="lastresb.com.co/nombre-del-proveedor" className={campo} /></div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label htmlFor="nombre" className="text-sm font-semibold">Tu nombre</label><input id="nombre" name="nombre" required className={campo} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="correo" className="text-sm font-semibold">Tu correo</label><input id="correo" name="correo" type="email" required className={campo} /></div>
              </div>
              <div className="flex flex-col gap-1.5"><label htmlFor="codigo" className="text-sm font-semibold">Código del servicio <span className="font-normal text-gris">(si lo tienes)</span></label><input id="codigo" name="codigo" maxLength={20} className={campo} /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="descripcion" className="text-sm font-semibold">Qué pasó</label><textarea id="descripcion" name="descripcion" rows={6} required minLength={30} maxLength={3000} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" /></div>
              <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2"><input type="checkbox" name="solicitaDatos" className="mt-0.5 size-[18px] flex-none accent-verde" /><span>Quiero que me entreguen los datos de identificación y contacto del proveedor (art. 53, Ley 1480).</span></label>
              <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2"><input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" /><span>Autorizo el tratamiento de mis datos para tramitar este reclamo, según la <a href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</a>.</span></label>
              <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="web">No llenar</label><input id="web" name="web" tabIndex={-1} autoComplete="off" /></div>
              <button type="submit" className="h-[54px] self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Enviar reclamo</button>
            </form>
          )}
        </section>

        <section className="mt-10 flex flex-col gap-3">
          <h2 className="font-display text-2xl font-bold">1. Presentación</h2>
          <p className="leading-relaxed">El reclamante puede presentar un reclamo de consumo ante LasTresB o directamente contra el proveedor, cuando corresponda, acreditando código de servicio o evidencia.</p>
          <h2 className="font-display text-2xl font-bold">2. Mecanismo</h2>
          <p className="leading-relaxed">LasTresB facilita el contacto y la comunicación entre usuario y proveedor. LasTresB no interviene en la responsabilidad civil derivada de la prestación del servicio.</p>
          <h2 className="font-display text-2xl font-bold">3. Plazo</h2>
          <p className="leading-relaxed">Respondemos el reclamo y entregamos los datos del proveedor, cuando se piden, dentro del plazo legal en días hábiles.</p>
          <h2 className="font-display text-2xl font-bold">4. Contenido que incumple las normas</h2>
          <p className="leading-relaxed">Para reportar una reseña o un perfil, usa el botón «Reportar» de cada uno. Para pedir el retiro de una foto o un texto, usa el <a href="/retiro-de-contenido" className="font-semibold text-verde underline">formulario de retiro de contenido</a>.</p>
        </section>
      </main>
      <Faq preguntas={FAQ_RECLAMOS} />
    </>
  );
}