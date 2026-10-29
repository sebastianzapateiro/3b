import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso, Chip, Encabezado, tarjeta, campoAdmin } from "@/components/admin/Ui";
import { colaModeracion, detalleModeracion, ETIQUETA_TIPO, MOTIVOS_MODERACION, TIPOS_COLA, type TipoCola } from "@/lib/moderacion";
import { parametro } from "@/lib/parametros";
import { exigirBackoffice } from "@/lib/verificacion";
import { decidir, marcarAtendida } from "./actions";

/** B3 · Moderación de contenido. Mockup: docs/mockups/BO_Moderacion.dc.html. */
const TABS: Record<TipoCola, string> = { todo: "Todo", resena: "Reseñas", foto: "Fotos", servicio: "Servicios", slug: "URL (slug)", perfil: "Perfiles", enlace: "Solicitudes de retiro" };
const horas = (d: Date) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000));
const fecha = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default async function Moderacion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles } = await exigirBackoffice();
  if (!roles.includes("moderador") && !roles.includes("admin")) redirect("/admin");
  const sp = await searchParams;
  const tipo = (TIPOS_COLA as readonly string[]).includes(sp.tipo ?? "") ? (sp.tipo as TipoCola) : "todo";

  const [cola, meta, umbral] = await Promise.all([colaModeracion(tipo), parametro("meta_atencion_reportes_h"), parametro("reportes_para_ocultar")]);
  const elegido = cola.find((c) => `${c.tipo}:${c.objetoId}` === sp.item) ?? cola[0];
  const detalle = elegido ? await detalleModeracion(elegido.tipo, elegido.objetoId) : null;
  const c = detalle?.contenido;
  const siguiente = elegido ? cola[(cola.indexOf(elegido) + 1) % cola.length] : undefined;
  const enlaceItem = (i: { tipo: string; objetoId: string }) => `/admin/moderacion?tipo=${tipo}&item=${encodeURIComponent(`${i.tipo}:${i.objetoId}`)}`;

  return (
    <>
      <Encabezado titulo="Moderación" subtitulo={`Reportes ordenados por número de reportes y antigüedad · meta de atención: ${meta} h`}>
        <nav aria-label="Tipo de contenido" className="flex flex-wrap gap-1.5">
          {TIPOS_COLA.map((t) => (
            <Link key={t} href={`/admin/moderacion?tipo=${t}`} aria-current={t === tipo ? "page" : undefined} className={`flex h-[38px] items-center rounded-full px-3.5 text-sm ${t === tipo ? "bg-tinta font-semibold text-white" : "border-[1.5px] border-borde-campo bg-white font-medium"}`}>{TABS[t]}</Link>
          ))}
        </nav>
      </Encabezado>

      <main className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        <div className="w-full"><Aviso ok={sp.ok} error={sp.error} /></div>
        <section aria-label="Cola de reportes" className="flex min-w-0 flex-[1_1_340px] flex-col gap-2.5">
          {cola.length === 0 && <p className={`${tarjeta} p-5 text-[15px] text-gris`}>No hay reportes pendientes en esta bandeja.</p>}
          {cola.map((i) => {
            const activo = i === elegido;
            return (
              <Link key={`${i.tipo}:${i.objetoId}`} href={enlaceItem(i)} aria-current={activo ? "true" : undefined} className={`flex flex-col gap-1.5 rounded-2xl bg-white px-4 py-3.5 ${activo ? "border-2 border-tinta" : "border border-[#EAE3D5]"}`}>
                <span className="flex justify-between gap-2 text-[13px]">
                  <b className={i.reportes >= umbral ? "text-ladrillo-oscuro" : ""}>{ETIQUETA_TIPO[i.tipo] ?? i.tipo} · {i.reportes} {i.reportes === 1 ? "reporte" : "reportes"}</b>
                  <span className={i.oculto ? "font-semibold text-ladrillo-oscuro" : "text-gris"}>{i.oculto ? "Oculto" : i.motivos[0]}</span>
                </span>
                <span className="break-words text-sm leading-snug">{i.titulo}</span>
                <span className="text-[13px] text-gris">{i.sobre} · hace {horas(i.primero)} h de {meta} h</span>
              </Link>
            );
          })}
        </section>

        {elegido && detalle && (
          <section className="flex min-w-0 flex-[2_1_520px] flex-col gap-[18px]">
            <div className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                <h2 className="font-display text-[22px] font-bold">{ETIQUETA_TIPO[elegido.tipo] ?? elegido.tipo} reportado</h2>
                <span className="flex gap-1.5">
                  {c?.verificada && <Chip tono="verde">Servicio verificado</Chip>}
                  {elegido.oculto && <Chip tono="rojo">{c?.estado === "en_revision" ? `Oculta por ${elegido.reportes} reportes` : "Oculto"}</Chip>}
                </span>
              </div>

              {c ? (
                <div className="flex flex-col gap-2 rounded-[14px] bg-crema p-4">
                  <span className="text-sm"><b>{c.cliente}</b> sobre <Link href={`/${c.slug}`} className="font-semibold text-verde">{c.proveedor}</Link> · {c.fecha && fecha(c.fecha)}</span>
                  <span className="text-[13px] tabular-nums text-tinta-2">Puntualidad {c.notas?.[0]} · Calidad {c.notas?.[1]} · Calidad/precio {c.notas?.[2]} · Cumplimiento {c.notas?.[3]}</span>
                  <p className="text-[15px] leading-[1.55]">{c.texto ?? "Sin comentario."}</p>
                  {c.respuesta && <div className="border-l-[3px] border-borde-campo pl-3 text-sm text-tinta-2"><b>Respuesta del proveedor:</b> {c.respuesta}</div>}
                </div>
              ) : (
                <div className="rounded-[14px] bg-crema p-4 text-[15px]">
                  <p className="break-words">{elegido.titulo}</p>
                  <p className="mt-1 text-sm text-gris">{elegido.sobre}</p>
                  {/^https?:\/\//.test(elegido.objetoId) && <a href={elegido.objetoId} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-verde">Abrir el enlace reportado</a>}
                </div>
              )}

              <h3 className="mt-1 text-[15px] font-bold">Reportes</h3>
              <ul className="flex flex-col gap-2 text-sm">
                {detalle.reportes.map((r, i) => (
                  <li key={i} className="flex justify-between gap-2.5">
                    <span><b>{r.motivo.replace(/^retiro:/, "Retiro: ")}</b>{r.detalle && ` · «${r.detalle}»`}</span>
                    <span className="flex-none text-gris">{r.reportante ?? "Visitante"} · {fecha(r.creado)}</span>
                  </li>
                ))}
              </ul>
              {detalle.accionesPrevias > 0 && <p className="text-sm text-gris">Este contenido ya tuvo {detalle.accionesPrevias} decisión(es) de moderación.</p>}
            </div>

            {elegido.tipo !== "enlace" && !/^https?:\/\//.test(elegido.objetoId) ? (
              <form action={decidir} className="flex flex-col gap-3.5 rounded-[20px] border-2 border-tinta bg-white p-[22px]">
                <input type="hidden" name="tipo" value={elegido.tipo} />
                <input type="hidden" name="objetoId" value={elegido.objetoId} />
                <h2 className="font-display text-xl font-bold">Decisión</h2>
                <fieldset className="flex flex-wrap gap-2.5">
                  <legend className="sr-only">Acción</legend>
                  {[
                    { v: "mantener", t: "Mantener", d: "Vuelve a ser visible" },
                    { v: "ocultar", t: "Ocultar", d: "Reversible" },
                    { v: "eliminar", t: "Eliminar", d: "Solo ilegal o datos personales" },
                  ].map((o, i) => (
                    <label key={o.v} className="flex min-w-40 flex-[1_1_160px] cursor-pointer items-start gap-2.5 rounded-[14px] border-[1.5px] border-borde-campo px-3.5 py-3 text-sm has-[:checked]:border-2 has-[:checked]:border-verde has-[:checked]:bg-verde-claro">
                      <input type="radio" name="accion" value={o.v} required defaultChecked={i === 1} className="mt-0.5 size-[18px] accent-verde" />
                      <span><b>{o.t}</b><br /><span className="text-gris">{o.d}</span></span>
                    </label>
                  ))}
                </fieldset>
                <label htmlFor="motivo" className="text-sm font-semibold">Motivo</label>
                <select id="motivo" name="motivo" className={campoAdmin}>{MOTIVOS_MODERACION.map((m) => <option key={m}>{m}</option>)}</select>
                <p className="rounded-xl bg-amarillo-suave px-3.5 py-3 text-sm leading-[1.45] text-amarillo-oscuro">Una reseña no se oculta por ser negativa. Tres contenidos ocultos del mismo proveedor en la ventana de reputación pasan su perfil a «en revisión».</p>
                <div className="flex flex-wrap justify-end gap-2.5">
                  {siguiente && siguiente !== elegido && <Link href={enlaceItem(siguiente)} className="flex h-[46px] items-center rounded-xl border-[1.5px] border-borde-campo bg-white px-[18px] text-[15px] font-semibold">Saltar</Link>}
                  <button type="submit" className="h-[46px] rounded-xl bg-tinta px-[22px] text-[15px] font-bold text-white">Guardar decisión</button>
                </div>
              </form>
            ) : (
              <div className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
                <p className="text-[15px] leading-normal text-tinta-2">Las solicitudes de retiro apuntan a un enlace, no a un contenido concreto. Revisa el enlace y, si corresponde, oculta el contenido desde su ficha en el backoffice (perfil, foto o reseña), o suspende la cuenta en <Link href="/admin/usuarios" className="font-semibold text-verde">Usuarios y roles</Link>. Luego responde a quien reportó por correo.</p>
                <form action={marcarAtendida} className="flex flex-col gap-2.5">
                  <input type="hidden" name="objetoId" value={elegido.objetoId} />
                  <label htmlFor="nota" className="text-sm font-semibold">Qué se hizo (opcional)</label>
                  <input id="nota" name="nota" maxLength={300} className={campoAdmin} />
                  <button type="submit" className="h-[46px] self-start rounded-xl bg-tinta px-5 text-[15px] font-bold text-white">Marcar como atendida</button>
                </form>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
