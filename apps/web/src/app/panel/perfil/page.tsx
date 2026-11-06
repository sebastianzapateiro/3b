import Link from "next/link";
import { opcionesComoTrabaja, REDES, redesDesdeBase } from "@las3b/shared";
import { CampoWhatsapp } from "@/components/CampoWhatsapp";
import { rutaPublicaDe } from "@/lib/ruta-proveedor";
import { Aviso } from "@/components/cuenta";
import { negocioEditable, whatsappParaCampo } from "@/lib/alta-proveedor";
import { FormularioGuiado } from "@/components/panel/FormularioGuiado";
import { exigirProveedor, perfilEditable } from "@/lib/panel";
import { CargaFotoPerfil } from "@/components/CargaFotoPerfil";
import { AVISO_SERVICIOS_SALUD, esOficioConAvisoSalud } from "@las3b/shared";
import { SelectorOficios } from "@/components/panel/SelectorOficios";
import { urlPublica } from "@/lib/almacenamiento";
import { parametro } from "@/lib/parametros";
import { ajustarComoTrabaja, guardarContactoPanel, guardarNegocioPanel, guardarPerfil, guardarRedes, quitarFotoPerfilAccion } from "../actions";

/** P8 · Perfil del proveedor (CU-34) y, en borrador, datos del negocio del alta (CU-30). Mockup: docs/mockups/Panel_proveedor.md. */
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";
const tarjeta = "flex scroll-mt-24 flex-col gap-5 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";

export const metadata = { title: "Tu perfil" };

export default async function PerfilPanel({ searchParams }: { searchParams: Promise<{ ajustar?: string; ok?: string; error?: string }> }) {
  const { proveedor: p, usuario } = await exigirProveedor();
  const sp = await searchParams;
  const borrador = p.estado === "borrador";
  const [e, n] = await Promise.all([perfilEditable(p.id), borrador ? negocioEditable(p.id) : null]);

  const op = opcionesComoTrabaja(e.slugsOficios);
  const redes = redesDesdeBase(p.redesSociales);
  const rutaPublica = await rutaPublicaDe(p.id, p.slug);
  const maxMbFoto = await parametro("foto_max_mb");
  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      {sp.ajustar && (
        <div role="alert" className="flex flex-col gap-3 rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">
          <p><b>Cambiaste de oficio.</b> Tenías marcado en «Cómo trabajas»: {sp.ajustar.split(",").map((c) => ({ ofreceGarantia: "garantía", atiendeUrgencias: "urgencias el mismo día", disponible24h: "24 horas" } as Record<string, string>)[c]).filter(Boolean).join(", ")}. Eso ya no aplica a tu nuevo oficio. ¿Lo quitamos o lo dejas así?</p>
          <form action={ajustarComoTrabaja} className="flex flex-wrap gap-2">
            <button name="decision" value="quitar" type="submit" className="h-11 rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Quitarlo</button>
            <button name="decision" value="dejar" type="submit" className="h-11 rounded-xl border-2 border-tinta px-4 text-sm font-semibold text-tinta">Dejarlo así</button>
          </form>
        </div>
      )}

      {e.slugsOficios.some(esOficioConAvisoSalud) && (
        <p role="note" className="rounded-[18px] border-2 border-amarillo-oscuro bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro"><b>Aviso importante.</b> {AVISO_SERVICIOS_SALUD}</p>
      )}

      <section id="foto" className={`${tarjeta} scroll-mt-24`}>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-bold">Tu foto <span className="text-base font-normal text-gris">(opcional)</span></h2>
          <p className="text-sm leading-normal text-tinta-2">Los clientes confían más en los perfiles con foto. Es opcional: si no la subes, tu perfil se publica igual.</p>
        </div>
        <CargaFotoPerfil actual={p.fotoPerfil ? urlPublica(p.fotoPerfil) : null} iniciales={p.nombre.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2)} maxMb={maxMbFoto} quitar={quitarFotoPerfilAccion} />
      </section>

      {borrador && (
        <FormularioGuiado id="contacto" action={guardarContactoPanel} className={`${tarjeta} scroll-mt-24`}>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold">Tus datos de contacto</h2>
            <p className="text-sm text-gris">Es lo primero que necesitamos: así te escribimos y los clientes te contactan.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombrePublico" className="text-sm font-semibold">Nombre público</label>
            <input id="nombrePublico" name="nombrePublico" required maxLength={80} defaultValue={p.nombre} placeholder="Ej: Plomería Jairo" className={campo} />
            <span className="text-xs text-gris">Así te ven los clientes. Puede ser tu nombre o el de tu empresa, si tienes una.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="whatsapp" className="text-sm font-semibold">WhatsApp</label>
            <CampoWhatsapp id="whatsapp" defaultValue={p.whatsapp} className={`${campo} sm:max-w-64`} />
            <span className="text-xs text-gris">Aquí te escriben los clientes.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Correo</span>
            <span className="flex min-h-13 items-center rounded-campo bg-piedra px-4 text-base text-tinta-2">{usuario.email}</span>
            <span className="text-xs text-gris">Es el de tu cuenta: ahí te avisamos de tu perfil.</span>
          </div>
          <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar y seguir</button>
        </FormularioGuiado>
      )}

      {n && (
        <FormularioGuiado id="negocio" action={guardarNegocioPanel} className={tarjeta}>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold">Tus oficios y tu página</h2>
            <p className="text-sm text-gris">Mientras tu perfil sea borrador puedes cambiarlos. Después de enviarlo, los revisa el equipo.</p>
          </div>
          <fieldset className="flex flex-col gap-2 text-[15px]">
            <legend className="mb-1 text-sm font-semibold">¿Cómo trabajas?</legend>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_sin_rut" required defaultChecked={p.segmento === "independiente_sin_rut"} className="size-5 accent-verde" />Independiente, todavía sin RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_con_rut" defaultChecked={p.segmento === "independiente_con_rut"} className="size-5 accent-verde" />Independiente con RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="empresa" defaultChecked={p.segmento === "empresa"} className="size-5 accent-verde" />Empresa</label>
          </fieldset>
          <SelectorOficios oficios={n.oficios} elegidos={[...n.elegidos]} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-semibold">Dirección de tu página</label>
            <div className="flex h-13 items-center rounded-campo border-[1.5px] border-borde-campo bg-white pl-4 sm:max-w-md">
              <span className="font-mono text-sm text-gris">lastresb.com.co/</span>
              <input id="slug" name="slug" required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={p.slug} className="h-full min-w-0 flex-1 rounded-r-campo pr-4 font-mono text-sm outline-none" />
            </div>
            <span className="text-xs text-gris">Minúsculas, números y guiones. Ej: plomeria-jairo-suba.</span>
          </div>
          <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar y seguir</button>
        </FormularioGuiado>
      )}

    <form action={guardarPerfil} className={tarjeta}>
      <h2 className="font-display text-2xl font-bold">Tu perfil</h2>

      <div id="sobre" className="flex scroll-mt-24 flex-col gap-1.5">
        <label htmlFor="presentacion" className="text-sm font-semibold">Sobre mí</label>
        <textarea id="presentacion" name="presentacion" rows={6} maxLength={1000} defaultValue={p.presentacion ?? ""} placeholder="Años de experiencia, en qué te especializas y cómo trabajas." className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
        <span className="text-xs text-gris">Hasta 1000 caracteres.</span>
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
        <legend className="mb-1 text-sm font-semibold">Cómo trabajas <span className="font-normal text-gris">(opcional)</span></legend>
        {op.has("ofreceGarantia") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="ofreceGarantia" defaultChecked={Boolean(p.ofreceGarantia)} className="size-5 accent-verde" />Ofrezco garantía por mi trabajo</label>}
        {op.has("atiendeUrgencias") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="atiendeUrgencias" defaultChecked={p.atiendeUrgencias} className="size-5 accent-verde" />Atiendo urgencias el mismo día</label>}
        {op.has("disponible24h") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="disponible24h" defaultChecked={p.disponible24h} className="size-5 accent-verde" />Atiendo 24 horas, incluidos fines de semana y festivos</label>}
        <label className="flex min-h-11 items-start gap-2.5 py-2"><input type="checkbox" name="visitaAConvenir" defaultChecked={p.visitaAConvenir} className="mt-0.5 size-5 flex-none accent-verde" /><span>Visita a convenir<span className="block text-sm text-gris">No publico precio de visita: lo acordamos por WhatsApp antes de ir.</span></span></label>
        <p className="text-sm text-gris">Si no marcas nada, quedas como «Visita a convenir». Estas etiquetas las declaras tú y se muestran en tu tarjeta; LasTresB no presta el servicio ni garantiza tiempos de llegada.</p>
      </fieldset>

      {!borrador && <div className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
        <b>Categorías:</b> {e.categorias.join(", ") || "—"}. <b>Dirección de tu página:</b> <span className="font-mono">lastresb.com.co{rutaPublica}</span>. Para cambiar tus categorías o tu dirección escríbenos desde la página de reclamos: el equipo debe revisarlo.
      </div>}

      <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar cambios</button>
    </form>

    <form action={guardarRedes} id="redes" className={`${tarjeta} scroll-mt-24`}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold">Redes sociales</h2>
        <p className="text-sm text-gris">Opcional. Si tienes redes o un sitio web, agrégalos: se ven en tu página para que los clientes conozcan más de tu trabajo. Escribe tu usuario (@tunegocio) o el enlace.</p>
      </div>
      {REDES.map((r) => (
        <div key={r.clave} className="flex flex-col gap-1.5">
          <label htmlFor={`red_${r.clave}`} className="text-sm font-semibold">{r.nombre}</label>
          <input id={`red_${r.clave}`} name={`red_${r.clave}`} defaultValue={redes[r.clave] ?? ""} placeholder={r.ejemplo} inputMode="url" autoComplete="off" maxLength={200} className={`${campo} sm:max-w-md`} />
        </div>
      ))}
      <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar redes</button>
    </form>

    <section id="fotos-trabajos" className={`${tarjeta} scroll-mt-24`}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold">Fotos de tus trabajos</h2>
        <p className="text-sm text-gris">Opcional, pero es lo que más confianza da: los clientes escriben más cuando ven tu trabajo. Son distintas a los documentos de verificación (esos son privados); estas se ven en tu página.</p>
      </div>
      <Link href="/panel/fotos" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-verde px-8 text-[17px] font-semibold text-white">Subir fotos de mis trabajos</Link>
    </section>
    </div>
  );
}
