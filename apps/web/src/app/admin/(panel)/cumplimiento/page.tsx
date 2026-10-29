import Link from "next/link";
import { Aviso, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { bandejaCumplimiento, BANDEJAS, detalleReclamo, detalleSolicitud, ETIQUETA_SOLICITUD, politicasVigentes, type Bandeja } from "@/lib/cumplimiento";
import { exigirBackoffice } from "@/lib/verificacion";
import { entregarDatos, gestionarSolicitud, publicarPolitica, responderReclamo } from "./actions";

/** B6 · Reclamos de consumo, solicitudes de datos y políticas. Mockup: docs/mockups/BO_Cumplimiento.dc.html. */
const TABS: Record<Bandeja, string> = { todo: "Todo abierto", reclamos: "Reclamos de consumo", datos: "Solicitudes de datos", politicas: "Políticas" };
const POLITICAS: Record<string, string> = { terminos_compradores: "Términos para compradores", terminos_proveedores: "Términos para proveedores", tratamiento_datos: "Tratamiento de datos", aviso_privacidad: "Aviso de privacidad", cookies: "Cookies", resenas: "Reglamento de reseñas", autorizacion_ley_1918: "Autorización Ley 1918", declaracion_servicios_no_permitidos: "Declaración de servicios no permitidos" };
const fechaCorta = (d: string | Date) => new Date(typeof d === "string" ? `${d}T00:00:00Z` : d).toLocaleDateString("es-CO", { dateStyle: "long", timeZone: "UTC" });
const ESTADO: Record<string, string> = { abierto: "Abierto", en_proceso: "En proceso", respondido: "Respondido", cerrado: "Cerrado" };

export default async function Cumplimiento({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles } = await exigirBackoffice();
  const sp = await searchParams;
  const bandeja = (BANDEJAS as readonly string[]).includes(sp.tab ?? "") ? (sp.tab as Bandeja) : "todo";
  const filas = bandeja === "politicas" ? [] : await bandejaCumplimiento(bandeja);
  const [clase, idSel] = (sp.i ?? "").split(":");
  const seleccion = clase === "reclamo" ? await detalleReclamo(idSel ?? "").catch(() => null) : null;
  const solicitud = clase === "datos" ? await detalleSolicitud(idSel ?? "").catch(() => null) : null;

  return (
    <>
      <Encabezado titulo="Reclamos y datos personales" subtitulo="Plazos en días hábiles con festivos de Colombia · se ordenan por lo que vence primero">
        <nav aria-label="Bandejas" className="flex flex-wrap gap-1.5">
          {BANDEJAS.map((b) => (
            <Link key={b} href={`/admin/cumplimiento?tab=${b}`} aria-current={b === bandeja ? "page" : undefined} className={`flex h-[38px] items-center rounded-full px-3.5 text-sm ${b === bandeja ? "bg-tinta font-semibold text-white" : "border-[1.5px] border-borde-campo bg-white font-medium"}`}>{b === "todo" ? `${TABS[b]} · ${filas.length}` : TABS[b]}</Link>
          ))}
        </nav>
      </Encabezado>

      <main className="flex flex-col gap-5 px-5 pb-10 pt-6 lg:px-8">
        <Aviso ok={sp.ok} error={sp.error} />

        {bandeja !== "politicas" && (
          <div className={`${tarjeta} overflow-x-auto`}>
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead><tr className="bg-crema text-left text-gris"><th className="px-[18px] py-3 font-semibold">Trámite</th><th className="p-3 font-semibold">Solicitante</th><th className="p-3 font-semibold">Sobre</th><th className="w-56 p-3 font-semibold">Plazo</th><th className="p-3 font-semibold">Estado</th></tr></thead>
              <tbody>
                {filas.length === 0 && <tr><td colSpan={5} className="px-[18px] py-8 text-center text-gris">No hay trámites abiertos.</td></tr>}
                {filas.map((f) => {
                  const pct = Math.round((f.usadosDias / f.totalDias) * 100);
                  const critico = f.restantes <= 1;
                  const medio = pct >= 50;
                  return (
                    <tr key={f.id} className={`border-t border-borde-suave ${critico ? "bg-[#FDF3F0]" : ""} ${idSel === f.id ? "outline outline-2 -outline-offset-2 outline-tinta" : ""}`}>
                      <td className="px-[18px] py-3.5"><Link href={`/admin/cumplimiento?tab=${bandeja}&i=${f.clase}:${f.id}`} className="flex flex-col"><b>{f.titulo}</b><span className="text-gris">{f.ley} · {f.id.slice(0, 8)}</span></Link></td>
                      <td className="p-3.5">{f.solicitante}</td>
                      <td className="p-3.5">{f.sobre}</td>
                      <td className="p-3.5">
                        <span className="flex flex-col gap-1.5">
                          <span className="h-2 rounded bg-[#EFE8DA]"><span className={`block h-2 rounded ${critico ? "bg-ladrillo" : medio ? "bg-amarillo" : "bg-verde"}`} style={{ width: `${pct}%` }} /></span>
                          <b className={`text-[13px] ${critico ? "text-ladrillo-oscuro" : medio ? "text-amarillo-oscuro" : "font-normal text-tinta-2"}`}>{f.restantes === 0 ? "Vence hoy" : f.restantes === 1 ? "Vence mañana" : `Quedan ${f.restantes}`} · {f.usadosDias} de {f.totalDias} días</b>
                        </span>
                      </td>
                      <td className="p-3.5">{ESTADO[f.estado] ?? f.estado}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-start gap-5">
          {seleccion && (
            <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3.5 rounded-[20px] border-2 border-tinta bg-white p-[22px]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[22px] font-bold">Reclamo de consumo {seleccion.reclamo.id.slice(0, 8)}</h2>
                <span className="text-[13px] font-semibold text-amarillo-oscuro">Vence el {fechaCorta(String(seleccion.reclamo.fechaLimite))}</span>
              </div>
              <p className="text-[15px] leading-[1.55] text-tinta-2">«{seleccion.reclamo.descripcion}»</p>
              <p className="text-sm text-gris">{seleccion.reclamo.nombreReclamante} · {seleccion.reclamo.correoReclamante} · sobre <Link href={`/${seleccion.proveedor?.slug}`} className="font-semibold text-verde">{seleccion.proveedor?.nombre}</Link></p>
              <div className="flex flex-wrap gap-3">
                <div className="flex min-w-52 flex-[1_1_220px] flex-col gap-1 rounded-[14px] bg-verde-claro p-3.5 text-sm text-verde-oscuro">
                  <b>{seleccion.servicio ? "Servicio acreditado" : "Sin servicio acreditado"}</b>
                  <span>{seleccion.servicio ? `Código ${seleccion.servicio.codigo} · llegada confirmada el ${fechaCorta(seleccion.servicio.llegada)}` : seleccion.reclamo.codigoServicio ? `Código ${seleccion.reclamo.codigoServicio} no encontrado` : "El comprador no indicó código de servicio."}</span>
                </div>
                <div className="flex min-w-52 flex-[1_1_220px] flex-col gap-1 rounded-[14px] bg-piedra p-3.5 text-sm">
                  <b>Historial del proveedor</b>
                  <span className="text-tinta-2">{seleccion.contactos} contactos · {seleccion.resenas} reseñas · {seleccion.reclamosPrevios} reclamos previos</span>
                </div>
              </div>
              {seleccion.reclamo.solicitaDatosProveedor && (
                <div className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-borde-campo p-4">
                  <b className="text-[15px]">El comprador pidió los datos del proveedor (art. 53, Ley 1480)</b>
                  <span className="text-sm leading-normal text-tinta-2">Se envían por correo: nombre o razón social, documento, dirección de notificaciones y teléfono. Queda registrada la fecha de entrega en el reclamo y en la auditoría.</span>
                  {seleccion.reclamo.datosEntregadosEn ? (
                    <span className="text-sm font-semibold text-verde-oscuro">Entregados el {fechaCorta(seleccion.reclamo.datosEntregadosEn)}</span>
                  ) : (
                    <form action={entregarDatos}><input type="hidden" name="id" value={seleccion.reclamo.id} /><button type="submit" className="h-11 rounded-xl bg-tinta px-[18px] text-[15px] font-bold text-white">Entregar datos al comprador</button></form>
                  )}
                </div>
              )}
              <form action={responderReclamo} className="flex flex-col gap-2.5">
                <input type="hidden" name="id" value={seleccion.reclamo.id} />
                <label htmlFor="respuesta" className="text-sm font-semibold">Respuesta al comprador</label>
                <textarea id="respuesta" name="respuesta" rows={3} required className="rounded-xl border-[1.5px] border-borde-campo p-3 text-[15px] leading-[1.45]" />
                <div className="flex flex-wrap justify-end gap-2.5">
                  {seleccion.proveedor && <Link href={`/admin/usuarios?u=${seleccion.proveedor.usuarioId}`} className="flex h-[46px] items-center rounded-xl border-2 border-ladrillo px-[18px] text-[15px] font-bold text-ladrillo-oscuro">Escalar: iniciar suspensión</Link>}
                  <button type="submit" className="h-[46px] rounded-xl bg-verde px-[22px] text-[15px] font-bold text-white">Responder y cerrar</button>
                </div>
              </form>
            </section>
          )}

          {solicitud && (
            <section className="flex min-w-0 flex-[2_1_480px] flex-col gap-3.5 rounded-[20px] border-2 border-tinta bg-white p-[22px]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[22px] font-bold">{ETIQUETA_SOLICITUD[solicitud.tipo]} · {solicitud.id.slice(0, 8)}</h2>
                <span className="text-[13px] font-semibold text-amarillo-oscuro">Vence el {fechaCorta(String(solicitud.limite))}</span>
              </div>
              <p className="text-sm text-gris">{solicitud.nombre} · {solicitud.correo} · enviada el {fechaCorta(solicitud.creado)}</p>
              <p className="text-[15px] leading-[1.55] text-tinta-2">{solicitud.detalle ? `«${solicitud.detalle}»` : "Sin detalle adicional."}</p>
              {(solicitud.tipo === "supresion" || solicitud.tipo === "exportacion") && (
                <p className="rounded-xl bg-amarillo-suave px-3.5 py-3 text-sm leading-[1.45] text-amarillo-oscuro">{solicitud.tipo === "supresion" ? "La supresión se ejecuta a mano: las reseñas publicadas se conservan bloqueadas 5 años y la auditoría no se borra." : "La copia de datos se prepara a mano y se envía por correo a la persona."}</p>
              )}
              <form action={gestionarSolicitud} className="flex flex-col gap-2.5">
                <input type="hidden" name="id" value={solicitud.id} />
                <label htmlFor="resp" className="text-sm font-semibold">Respuesta a la persona</label>
                <textarea id="resp" name="respuesta" rows={3} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-[15px] leading-[1.45]" />
                <div className="flex flex-wrap justify-end gap-2.5">
                  <button type="submit" name="estado" value="en_proceso" className="h-[46px] rounded-xl border-[1.5px] border-borde-campo bg-white px-[18px] text-[15px] font-semibold">Marcar en proceso</button>
                  <button type="submit" name="estado" value="respondido" className="h-[46px] rounded-xl bg-verde px-[22px] text-[15px] font-bold text-white">Responder y cerrar</button>
                </div>
              </form>
            </section>
          )}

          {bandeja === "politicas" && (
            <section className={`${tarjeta} flex min-w-0 flex-[1_1_300px] flex-col gap-3 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">Políticas vigentes</h2>
              <PoliticasVigentes />
            </section>
          )}

          {bandeja === "politicas" && roles.includes("admin") && (
            <form action={publicarPolitica} className={`${tarjeta} flex min-w-0 flex-[2_1_420px] flex-col gap-3 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">Publicar nueva versión</h2>
              <div className="flex gap-2.5">
                <div className="flex min-w-0 flex-[2] flex-col gap-1.5"><label htmlFor="tipo" className="text-sm font-semibold">Política</label><select id="tipo" name="tipo" className={campoAdmin}>{Object.entries(POLITICAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5"><label htmlFor="version" className="text-sm font-semibold">Versión</label><input id="version" name="version" required placeholder="2.1" className={campoAdmin} /></div>
              </div>
              <label htmlFor="contenido" className="text-sm font-semibold">Texto (Markdown)</label>
              <textarea id="contenido" name="contenido" rows={10} required className="rounded-xl border-[1.5px] border-borde-campo p-3 font-mono text-sm leading-[1.45]" />
              <span className="text-[13px] leading-[1.45] text-gris">Cambio esencial: aviso con 15 días y re-aceptación. Mientras no acepten, se bloquea calificar y editar el perfil, nunca eliminar la cuenta ni reclamar. La re-aceptación automática aún no está construida.</span>
              <button type="submit" className="h-11 self-end rounded-xl bg-tinta px-5 text-[15px] font-bold text-white">Publicar versión</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

async function PoliticasVigentes() {
  const lista = await politicasVigentes();
  return (
    <ul className="flex flex-col gap-2.5 text-sm">
      {lista.map((p) => <li key={p.tipo} className="flex justify-between gap-2"><span>{POLITICAS[p.tipo] ?? p.tipo}</span><span className="text-gris">v{p.version}</span></li>)}
    </ul>
  );
}
