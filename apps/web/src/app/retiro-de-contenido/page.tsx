import { RETIRO_CONTENIDO } from "@las3b/shared";
import { Faq } from "@/components/Faq";
import { TextoLegal } from "@/components/TextoLegal";
import { FAQ_RETIRO } from "@/lib/faqs";
import { meta } from "@/lib/seo";
import { solicitarRetiro } from "./actions";

export const metadata = meta({ titulo: "Retiro de contenido y derechos de autor", descripcion: "Cómo pedir la revisión y el retiro de una foto, texto o perfil que infringe tus derechos en Las 3B.", ruta: "/retiro-de-contenido" });

const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";

/** Procedimiento de notificación y retiro de contenido, con formulario público. */
export default async function RetiroDeContenido({ searchParams }: { searchParams: Promise<{ error?: string; enviado?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <TextoLegal texto={RETIRO_CONTENIDO}>
        <section id="formulario" className="mt-10 flex scroll-mt-24 flex-col gap-4 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">Presentar una solicitud</h2>
          {sp.enviado ? (
            <p role="status" className="rounded-xl bg-verde-claro p-4 text-[15px] text-verde-oscuro"><b>Recibimos tu solicitud.</b> La revisaremos y te escribiremos al correo que dejaste.</p>
          ) : (
            <form action={solicitarRetiro} className="flex flex-col gap-3.5">
              {sp.error && <p role="alert" className="rounded-xl bg-ladrillo-suave p-3 text-[15px] text-ladrillo-oscuro">{sp.error}</p>}
              <div className="flex flex-col gap-1.5"><label htmlFor="enlace" className="text-sm font-semibold">Enlace del contenido en Las 3B</label><input id="enlace" name="enlace" type="url" required placeholder="https://lastresb.com.co/..." className={campo} /></div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label htmlFor="tipo" className="text-sm font-semibold">Qué es</label><select id="tipo" name="tipo" className={campo}><option value="foto">Una foto</option><option value="perfil">Un perfil</option><option value="servicio">Un servicio o precio</option><option value="resena">Una reseña</option><option value="respuesta">Una respuesta a una reseña</option></select></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="motivo" className="text-sm font-semibold">Motivo</label><select id="motivo" name="motivo" className={campo}><option value="derechos_de_autor">Infringe mis derechos de autor</option><option value="datos_personales">Publica datos personales míos</option><option value="suplantacion">Me suplanta</option><option value="menores">Muestra a menores</option><option value="otro">Otro</option></select></div>
              </div>
              <div className="flex flex-col gap-1.5"><label htmlFor="descripcion" className="text-sm font-semibold">Qué ocurre y qué derecho tienes</label><textarea id="descripcion" name="descripcion" rows={5} required minLength={20} maxLength={2000} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" /></div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label htmlFor="nombre" className="text-sm font-semibold">Tu nombre</label><input id="nombre" name="nombre" required className={campo} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="correo" className="text-sm font-semibold">Tu correo</label><input id="correo" name="correo" type="email" required className={campo} /></div>
              </div>
              <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="web">No llenar</label><input id="web" name="web" tabIndex={-1} autoComplete="off" /></div>
              <label className="flex items-start gap-2.5 text-sm leading-snug text-tinta-2"><input type="checkbox" name="buenaFe" required className="mt-0.5 size-[18px] accent-verde" />Declaro de buena fe que la información de esta solicitud es verdadera y que estoy legitimado para presentarla.</label>
              <button type="submit" className="h-[54px] self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Enviar solicitud</button>
            </form>
          )}
        </section>
      </TextoLegal>
      <Faq preguntas={FAQ_RETIRO} />
    </>
  );
}
