import Link from "next/link";
import { Faq } from "@/components/Faq";
import { FAQ_CONTACTO } from "@/lib/faqs";
import { meta } from "@/lib/seo";
import { MOTIVOS_CONTACTO } from "@/lib/contacto";
import { enviarMensaje } from "./actions";

export const metadata = meta({ titulo: "Contacto", descripcion: "Escríbenos para resolver una duda, contarnos una sugerencia o hablar con el equipo de LasTresB.", ruta: "/contacto" });

const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";
const tarjeta = "rounded-[22px] border border-borde-suave bg-white shadow-[0_8px_30px_rgba(27,38,35,0.06)]";

/** Contacto: formulario sencillo y atajos a los canales con plazos (reclamos, datos, retiro de contenido). */
export default async function Contacto({ searchParams }: { searchParams: Promise<{ enviado?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <main className="mx-auto flex max-w-[1000px] flex-col gap-6 px-5 pb-10 pt-6 sm:px-6 md:pt-12">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-[-1px] md:text-5xl">Contacto</h1>
          <p className="max-w-[600px] text-base leading-normal text-tinta-2 md:text-lg">Cuéntanos qué necesitas. Te respondemos al correo que dejes.</p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
          <section id="formulario" className={`${tarjeta} flex scroll-mt-24 flex-col gap-4 p-5 sm:p-6`}>
            <h2 className="font-display text-2xl font-bold">Escríbenos</h2>
            {sp.enviado ? (
              <p role="status" className="rounded-xl bg-verde-claro p-4 text-[15px] leading-normal text-verde-oscuro"><b>Gracias, recibimos tu mensaje.</b> Te responderemos al correo que dejaste.</p>
            ) : (
              <form action={enviarMensaje} className="flex flex-col gap-3.5">
                {sp.error && <p role="alert" className="rounded-xl bg-ladrillo-suave p-3 text-[15px] text-ladrillo-oscuro">{sp.error}</p>}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><label htmlFor="nombre" className="text-sm font-semibold">Tu nombre</label><input id="nombre" name="nombre" required className={campo} /></div>
                  <div className="flex flex-col gap-1.5"><label htmlFor="correo" className="text-sm font-semibold">Tu correo</label><input id="correo" name="correo" type="email" required className={campo} /></div>
                </div>
                <div className="flex flex-col gap-1.5"><label htmlFor="motivo" className="text-sm font-semibold">Motivo</label><select id="motivo" name="motivo" className={campo}>{MOTIVOS_CONTACTO.map((m) => <option key={m}>{m}</option>)}</select></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="mensaje" className="text-sm font-semibold">Mensaje</label><textarea id="mensaje" name="mensaje" rows={6} required minLength={10} maxLength={3000} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" /></div>
                <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2"><input type="checkbox" name="autoriza" required className="mt-0.5 size-[18px] flex-none accent-verde" /><span>Autorizo el uso de mis datos para responder este mensaje, según la <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</Link>.</span></label>
                <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="web">No llenar</label><input id="web" name="web" tabIndex={-1} autoComplete="off" /></div>
                <button type="submit" className="h-[54px] self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white max-sm:self-stretch">Enviar mensaje</button>
              </form>
            )}
          </section>

          <aside className={`${tarjeta} flex flex-col gap-3 p-5 sm:p-6`}>
            <h2 className="font-display text-xl font-bold">Antes de escribir</h2>
            <p className="text-[15px] leading-normal text-tinta-2">Para estos temas hay un canal con plazos propios:</p>
            <ul className="flex flex-col text-[15px]">
              <li><Link href="/reclamos" className="inline-flex min-h-11 items-center font-semibold text-verde hover:text-verde-oscuro">Presentar un reclamo sobre un proveedor</Link></li>
              <li><Link href="/cuenta/privacidad" className="inline-flex min-h-11 items-center font-semibold text-verde hover:text-verde-oscuro">Consultar o eliminar mis datos</Link></li>
              <li><Link href="/retiro-de-contenido" className="inline-flex min-h-11 items-center font-semibold text-verde hover:text-verde-oscuro">Pedir el retiro de una foto o un texto</Link></li>
              <li><Link href="/como-funciona" className="inline-flex min-h-11 items-center font-semibold text-verde hover:text-verde-oscuro">Cómo funciona LasTresB</Link></li>
            </ul>
          </aside>
        </div>
      </main>
      <Faq preguntas={FAQ_CONTACTO} />
    </>
  );
}