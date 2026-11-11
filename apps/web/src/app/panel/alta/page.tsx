import Link from "next/link";
import { redirect } from "next/navigation";
import { AVISO_SERVICIOS_SALUD, esOficioConAvisoSalud, opcionesComoTrabaja, REDES, redesDesdeBase, serviciosSugeridos } from "@las3b/shared";
import { Aviso } from "@/components/cuenta";
import { CampoWhatsapp } from "@/components/CampoWhatsapp";
import { CargaDocumento } from "@/components/CargaDocumento";
import { CargaFotoPerfil } from "@/components/CargaFotoPerfil";
import { CargaFotos } from "@/components/CargaFotos";
import { AutoGuardadoAlta } from "@/components/panel/AutoGuardadoAlta";
import { CamposServicio } from "@/components/panel/CamposServicio";
import { SelectorOficios } from "@/components/panel/SelectorOficios";
import { urlPublica } from "@/lib/almacenamiento";
import { negocioEditable, pendientesAlta } from "@/lib/alta-proveedor";
import { FOTOS_MINIMAS } from "@/lib/completitud";
import { estadoDocumentos, pideNumeroMatricula } from "@/lib/documentos";
import { fotosDelProveedor } from "@/lib/fotos";
import { exigirProveedor, perfilEditable, serviciosDelProveedor } from "@/lib/panel";
import { parametro } from "@/lib/parametros";
import { oficiosDelProveedor } from "@/lib/precios";
import { actualizarServicio, agregarServicio, quitarFotoTrabajo, quitarFotoPerfilAccion, quitarServicio } from "../actions";

/**
 * P8 · Alta del proveedor en una sola página (CU-30): todo lo que se pide, en orden, sin pantallas separadas. Cada campo se guarda solo
 * (AutoGuardadoAlta + /api/v1/yo/alta) y nada de lo ya escrito se pierde. Servicios, fotos y documentos se guardan al instante por su cuenta.
 * Solo en borrador: ya enviado, el perfil se edita en /panel/perfil, /panel/servicios y /panel/fotos.
 */
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";
const tarjeta = "flex scroll-mt-24 flex-col gap-4 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const titulo = "font-display text-2xl font-bold";
const opcional = <span className="text-base font-normal text-gris">(opcional)</span>;

export const metadata = { title: "Tu perfil" };

export default async function AltaPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; bienvenida?: string }> }) {
  const { proveedor: p, usuario } = await exigirProveedor();
  if (p.estado !== "borrador") redirect("/panel/perfil");
  const sp = await searchParams;

  const [e, n, alta, oficios, servicios, docs, fotos, pideMatricula, maxMbFoto, maximoFotos] = await Promise.all([
    perfilEditable(p.id), negocioEditable(p.id), pendientesAlta(p.id), oficiosDelProveedor(p.id), serviciosDelProveedor(p.id),
    estadoDocumentos(p.id), fotosDelProveedor(p.id), pideNumeroMatricula(p.id), parametro("foto_max_mb"), parametro("fotos_max"),
  ]);
  const op = opcionesComoTrabaja(e.slugsOficios);
  const redes = redesDesdeBase(p.redesSociales);
  const sugeridos = Object.fromEntries(oficios.map((o) => [o.id, serviciosSugeridos(o.slug)]));
  const identidadGuardada = alta.tareas.find((t) => t.clave === "identidad")?.ok ?? false;
  const sinPrecio = oficios.length > 0 && oficios.every((o) => o.sinPrecio);

  return (
    <div className="flex flex-col gap-5">
      {sp.bienvenida === "1" && <Aviso tono="exito">¡Listo, tu perfil ya existe! Llena lo que sigue: todo está en esta página y se guarda solo.</Aviso>}
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      <AutoGuardadoAlta>
        {/* 1 · Datos */}
        <section id="contacto" data-alta className={tarjeta}>
          <h2 className={titulo}>1. Tus datos</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombrePublico" className="text-sm font-semibold">Nombre público</label>
            <input id="nombrePublico" name="nombrePublico" maxLength={80} defaultValue={p.nombre} placeholder="Ej: Plomería Jairo" className={campo} />
            <span className="text-xs text-gris">Así te ven los clientes. Puede ser tu nombre o el de tu empresa.</span>
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
        </section>

        {/* 2 · Oficios y negocio */}
        <section id="negocio" data-alta className={tarjeta}>
          <h2 className={titulo}>2. Tus oficios y tu página</h2>
          <fieldset className="flex flex-col gap-2 text-[15px]">
            <legend className="mb-1 text-sm font-semibold">¿Cómo trabajas?</legend>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_sin_rut" defaultChecked={p.segmento === "independiente_sin_rut"} className="size-5 accent-verde" />Independiente, todavía sin RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="independiente_con_rut" defaultChecked={p.segmento === "independiente_con_rut"} className="size-5 accent-verde" />Independiente con RUT</label>
            <label className="flex min-h-11 items-center gap-2.5"><input type="radio" name="segmento" value="empresa" defaultChecked={p.segmento === "empresa"} className="size-5 accent-verde" />Empresa</label>
          </fieldset>
          <SelectorOficios oficios={n.oficios} elegidos={[...n.elegidos]} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-semibold">Dirección de tu página</label>
            <div className="flex h-13 items-center rounded-campo border-[1.5px] border-borde-campo bg-white pl-4 sm:max-w-md">
              <span className="font-mono text-sm text-gris">lastresb.com.co/</span>
              <input id="slug" name="slug" maxLength={60} defaultValue={p.slug} className="h-full min-w-0 flex-1 rounded-r-campo pr-4 font-mono text-sm outline-none" />
            </div>
            <span className="text-xs text-gris">Minúsculas, números y guiones. Ej: plomeria-jairo-suba.</span>
          </div>
        </section>

        {/* 3 · Servicios: cada uno se guarda con su botón */}
        <section id="servicios" className={tarjeta}>
          <div className="flex flex-col gap-1">
            <h2 className={titulo}>3. Tus servicios y precios</h2>
            <p className="text-sm leading-normal text-tinta-2">
              {sinPrecio ? "En tu página el precio aparece como «a convenir con el proveedor»." : "Los precios son orientativos: el valor final lo acuerdas con cada cliente. Se muestran como «desde»."} Con uno ya puedes publicar.
            </p>
          </div>
          {oficios.length === 0 && <p className="rounded-[14px] bg-amarillo-suave px-4 py-3 text-sm text-amarillo-oscuro">Primero elige tus oficios arriba: cada servicio va dentro de uno de ellos.</p>}
          {servicios.slice().sort((x, y) => (x.categoriaId ?? 0) - (y.categoriaId ?? 0)).map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-borde-suave bg-crema p-4">
              <form action={actualizarServicio} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={s.id} />
                <CamposServicio oficios={oficios} sugeridos={sugeridos} s={{ nombre: s.nombre, descripcion: s.descripcion, precioDesde: s.precioDesde, unidad: s.unidad, categoriaId: s.categoriaId }} />
                <button type="submit" className="h-11 self-start rounded-xl bg-tinta px-5 text-sm font-semibold text-white">Guardar este servicio</button>
              </form>
              <form action={quitarServicio}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-ladrillo-oscuro">Quitar este servicio</button>
              </form>
            </div>
          ))}
          {oficios.length > 0 && (
            <form action={agregarServicio} className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-borde-campo p-4">
              <h3 className="font-display text-lg font-bold">Agregar un servicio</h3>
              <CamposServicio oficios={oficios} sugeridos={sugeridos} />
              <button type="submit" className="h-11 self-start rounded-xl bg-verde px-5 text-sm font-semibold text-white">Agregar servicio</button>
            </form>
          )}
        </section>

        {/* 4 · Localidades */}
        <section id="localidades" data-alta className={tarjeta}>
          <h2 className={titulo}>4. Dónde trabajas</h2>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-semibold">Localidades de Bogotá en las que atiendes</legend>
            <div className="flex flex-wrap gap-2">
              {e.localidades.map((l) => (
                <label key={l.id} className="flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-borde-campo px-4 text-sm has-[:checked]:border-verde has-[:checked]:bg-verde has-[:checked]:font-semibold has-[:checked]:text-white">
                  <input type="checkbox" name="localidad" value={l.id} defaultChecked={e.localidadesElegidas.has(l.id)} className="size-4 accent-white" />
                  {l.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {/* 5 · Sobre ti */}
        <section id="sobre" data-alta className={tarjeta}>
          <h2 className={titulo}>5. Sobre ti {opcional}</h2>
          {e.slugsOficios.some(esOficioConAvisoSalud) && <p role="note" className="rounded-[14px] border-2 border-amarillo-oscuro bg-amarillo-suave p-3 text-sm leading-snug text-amarillo-oscuro"><b>Aviso importante.</b> {AVISO_SERVICIOS_SALUD}</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="presentacion" className="text-sm font-semibold">Cuéntales a tus clientes</label>
            <textarea id="presentacion" name="presentacion" rows={5} maxLength={1000} defaultValue={p.presentacion ?? ""} placeholder="Años de experiencia, en qué te especializas y cómo trabajas." className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
            <span className="text-xs text-gris">Hasta 1000 caracteres.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="aniosExperiencia" className="text-sm font-semibold">Años de experiencia</label>
            <input id="aniosExperiencia" name="aniosExperiencia" type="number" min={0} max={80} defaultValue={p.aniosExperiencia ?? ""} className={`${campo} sm:max-w-40`} />
          </div>
          <fieldset className="flex flex-col gap-2 text-[15px]">
            <legend className="mb-1 text-sm font-semibold">Cómo trabajas</legend>
            <input type="hidden" name="_como" value="1" />
            {op.has("ofreceGarantia") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="ofreceGarantia" defaultChecked={Boolean(p.ofreceGarantia)} className="size-5 accent-verde" />Ofrezco garantía por mi trabajo</label>}
            {op.has("atiendeUrgencias") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="atiendeUrgencias" defaultChecked={p.atiendeUrgencias} className="size-5 accent-verde" />Atiendo urgencias el mismo día</label>}
            {op.has("disponible24h") && <label className="flex min-h-11 items-center gap-2.5"><input type="checkbox" name="disponible24h" defaultChecked={p.disponible24h} className="size-5 accent-verde" />Atiendo 24 horas, incluidos fines de semana y festivos</label>}
            <label className="flex min-h-11 items-start gap-2.5 py-2"><input type="checkbox" name="visitaAConvenir" defaultChecked={p.visitaAConvenir} className="mt-0.5 size-5 flex-none accent-verde" /><span>Visita a convenir<span className="block text-sm text-gris">No publico precio de visita: lo acordamos por WhatsApp antes de ir.</span></span></label>
            <p className="text-sm text-gris">Si no marcas nada, quedas como «Visita a convenir». Estas etiquetas las declaras tú; LasTresB no presta el servicio ni garantiza tiempos de llegada.</p>
          </fieldset>
        </section>

        {/* 6 · Fotos */}
        <section id="foto" className={tarjeta}>
          <h2 className={titulo}>6. Tus fotos {opcional}</h2>
          <p className="text-sm leading-normal text-tinta-2">Los clientes confían más en los perfiles con foto, y las fotos de tus trabajos son lo que más confianza da. Si no subes la tuya, mostramos una imagen según tu oficio.</p>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Tu foto de perfil</h3>
            <CargaFotoPerfil actual={p.fotoPerfil ? urlPublica(p.fotoPerfil) : null} iniciales={p.nombre.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2)} maxMb={maxMbFoto} quitar={quitarFotoPerfilAccion} />
          </div>
          <div id="fotos-trabajos" className="flex scroll-mt-24 flex-col gap-3">
            <h3 className="text-sm font-semibold">Fotos de tus trabajos <span className="font-normal text-gris">({fotos.length < FOTOS_MINIMAS ? `sube al menos ${FOTOS_MINIMAS}` : "ya tienes las mínimas"})</span></h3>
            <CargaFotos maxMb={maxMbFoto} quedan={Math.max(0, maximoFotos - fotos.length)} />
            {fotos.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {fotos.map((f) => (
                  <li key={f.id} className="flex flex-col gap-1.5">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-borde-suave">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.descripcion ?? "Foto de trabajo"} className="size-full object-cover" loading="lazy" />
                    </div>
                    <form action={quitarFotoTrabajo}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-ladrillo-oscuro">Quitar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 7 · Redes */}
        <section id="redes" data-alta className={tarjeta}>
          <h2 className={titulo}>7. Redes sociales {opcional}</h2>
          <p className="text-sm text-gris">Si tienes redes o un sitio web, agrégalos: se ven en tu página. Escribe tu usuario (@tunegocio) o el enlace.</p>
          {REDES.map((r) => (
            <div key={r.clave} className="flex flex-col gap-1.5">
              <label htmlFor={`red_${r.clave}`} className="text-sm font-semibold">{r.nombre}</label>
              <input id={`red_${r.clave}`} name={`red_${r.clave}`} defaultValue={redes[r.clave] ?? ""} placeholder={r.ejemplo} inputMode="url" autoComplete="off" maxLength={200} className={`${campo} sm:max-w-md`} />
            </div>
          ))}
        </section>

        {/* 8 · Identidad y documentos */}
        <section id="identidad" data-alta className={tarjeta}>
          <h2 className={titulo}>8. Tu identidad</h2>
          <p className="text-sm leading-normal text-gris">
            {identidadGuardada ? "Ya guardaste tus datos de identidad. Por seguridad no se vuelven a mostrar: si necesitas corregirlos, escríbelos de nuevo. " : ""}Los usa solo el equipo de verificación. No aparecen en tu página ni se comparten.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_200px] flex-col gap-1.5">
              <label htmlFor="tipoDocumento" className="text-sm font-semibold">Tipo de documento</label>
              <select id="tipoDocumento" name="tipoDocumento" defaultValue="cc" className={campo}>
                <option value="cc">Cédula de ciudadanía</option>
                <option value="ce">Cédula de extranjería</option>
                <option value="ppt">Permiso por protección temporal (PPT)</option>
                <option value="nit">NIT</option>
              </select>
            </div>
            <div className="flex flex-[1_1_200px] flex-col gap-1.5">
              <label htmlFor="documento" className="text-sm font-semibold">Número</label>
              <input id="documento" name="documento" inputMode="numeric" autoComplete="off" placeholder="Sin puntos ni espacios" className={campo} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fechaNacimiento" className="text-sm font-semibold">Fecha de nacimiento</label>
            <input id="fechaNacimiento" name="fechaNacimiento" type="date" autoComplete="bday" className={`${campo} sm:max-w-56`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="direccionNotificaciones" className="text-sm font-semibold">Dirección de notificaciones {opcional}</label>
            <input id="direccionNotificaciones" name="direccionNotificaciones" autoComplete="street-address" placeholder="Calle 123 # 45-67, Bogotá" className={campo} />
          </div>
          {pideMatricula && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="numeroMatricula" className="text-sm font-semibold">Número de matrícula o tarjeta profesional {opcional}</label>
              <input id="numeroMatricula" name="numeroMatricula" maxLength={30} autoComplete="off" placeholder="Solo el número, no hace falta subir foto" className={`${campo} sm:max-w-80`} />
              <span className="text-xs text-gris">Tu oficio la usa para verificar tu insignia. Solo la ve el equipo.</span>
            </div>
          )}
        </section>

        <section id="documentos" className={tarjeta}>
          <h2 className={titulo}>Tus documentos {opcional}</h2>
          <div className="flex flex-col gap-2.5">{docs.lista.map((d) => <CargaDocumento key={d.tipo} doc={d} />)}</div>
          <p className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
            Son privados: solo los ve el equipo de verificación y cada apertura queda registrada. Subirlos es opcional y nunca se publican. Si cambias un archivo, el nuevo reemplaza al anterior.
          </p>
        </section>
      </AutoGuardadoAlta>

      <section className={`${tarjeta} items-start`}>
        <h2 className={titulo}>{alta.listo ? "¡Todo listo!" : "Cuando termines"}</h2>
        <p className="text-sm leading-normal text-tinta-2">
          {alta.listo ? "Ya tienes lo obligatorio. Revisa y publica tu perfil: aceptas los términos y el equipo lo revisa." : `Te falta: ${alta.tareas.filter((t) => !t.ok && !t.opcional).map((t) => t.titulo.toLowerCase()).join(", ")}.`}
        </p>
        <Link href="/panel/confirmar" aria-disabled={!alta.listo} className={`flex h-[54px] items-center justify-center rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white ${alta.listo ? "" : "pointer-events-none opacity-50"}`}>Revisar y publicar</Link>
      </section>
    </div>
  );
}
