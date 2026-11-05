import Link from "next/link";
import { notFound } from "next/navigation";
import { botonBorde, botonOscuro, Chip, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { enlaceConMensaje } from "@las3b/shared";
import { listarSolicitudes } from "@/lib/solicitudes";
import { exigirBackoffice } from "@/lib/verificacion";
import { calificacionesPorEnviar } from "@/lib/servicios-prestados";
import { whatsappAvisarCliente, whatsappPedirAProveedor, whatsappSinProveedor } from "@/lib/plantillas";
import { conteosSeguimiento, datosEstado, ESTADOS_CERRADOS, ESTADOS_SOLICITUD, historialDe, sugerirProveedores, type EventoHistorial } from "@/lib/seguimiento-solicitudes";
import { hoyBogota } from "@/lib/seguimiento";
import {
  agregarNotaSolicitud, cambiarEstadoSolicitud, marcarCalificacionEnviadaPorWhatsapp, programarAccionSolicitud,
  registrarClienteAvisado, registrarProveedorContactado, tomarSolicitud,
} from "./actions";

/** B7 · Solicitudes de clientes («¿Qué estás buscando?»): seguimiento de cada caso desde que dejan su WhatsApp hasta que los atiende un proveedor. Solo administradores. */
const fecha = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
const dia = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-CO", { dateStyle: "medium" });
const pestana = "inline-flex h-10 items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 text-sm font-semibold";

function textoEvento(e: EventoHistorial) {
  const estado = e.estadoNuevo ? ` → ${datosEstado(e.estadoNuevo)[1]}` : "";
  if (e.tipo === "proveedor") return `Le escribió a ${e.proveedor ?? "un proveedor"}${estado}`;
  if (e.tipo === "cliente") return `Le escribió al cliente${estado}`;
  if (e.tipo === "estado") return `Cambió el estado${estado}`;
  if (e.tipo === "asignacion") return `Asignación${estado}`;
  return "Nota";
}

export const metadata = { title: "Solicitudes" };

export default async function Solicitudes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles, user } = await exigirBackoffice();
  if (!roles.includes("admin")) notFound();
  const sp = await searchParams;
  const rangoDemanda = (["7", "30", "mes"] as const).find((r) => r === sp.rango) ?? "30";
  const demanda = sp.demanda === "1" ? { oficioSlug: sp.d, texto: sp.dt, localidadSlug: sp.dl && sp.dl !== "-" ? sp.dl : undefined, rango: rangoDemanda } : undefined;
  const filtro = { demanda, estado: sp.estado, sinResultado: sp.sin === "1", q: sp.q, todas: true, vencidas: sp.vencidas === "1", responsableId: sp.mios === "1" ? user.id : undefined };
  const [filas, porEnviar, conteos] = await Promise.all([listarSolicitudes(filtro), calificacionesPorEnviar(), conteosSeguimiento(user.id)]);
  // Filtros que se aplican sobre la lista: dejó o no WhatsApp, y rango de fechas (día de Bogotá).
  const dia0 = (iso?: string) => (iso ? new Date(`${iso}T00:00:00-05:00`).getTime() : null);
  const desdeMs = dia0(sp.desde);
  const hastaMs = sp.hasta ? new Date(`${sp.hasta}T23:59:59-05:00`).getTime() : null;
  const visibles = filas.filter((x) => (sp.wa === "con" ? Boolean(x.whatsapp) : sp.wa === "sin" ? !x.whatsapp : true) && (desdeMs == null || new Date(x.creada).getTime() >= desdeMs) && (hastaMs == null || new Date(x.creada).getTime() <= hastaMs));
  const historial = await historialDe(filas.map((s) => s.id));
  const hoy = hoyBogota();

  const actuales = Object.entries({ c: sp.c, demanda: sp.demanda, rango: sp.rango, d: sp.d, dt: sp.dt, dl: sp.dl, estado: sp.estado, sin: sp.sin, q: sp.q, wa: sp.wa, desde: sp.desde, hasta: sp.hasta, vencidas: sp.vencidas, mios: sp.mios }).filter((e): e is [string, string] => Boolean(e[1]));
  const ruta = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams(actuales);
    for (const [k, v] of Object.entries(cambios)) (v == null ? p.delete(k) : p.set(k, v));
    const q = p.toString();
    return `/admin/solicitudes${q ? `?${q}` : ""}`;
  };
  const volver = ruta({});
  const volverSinCaso = ruta({ c: null });
  const exportar = `/admin/solicitudes/exportar?${new URLSearchParams(actuales.filter(([k]) => ["estado", "sin", "q"].includes(k)))}`;
  const abiertas = ESTADOS_SOLICITUD.filter(([v]) => !ESTADOS_CERRADOS.includes(v)).reduce((n, [v]) => n + (conteos.porEstado[v] ?? 0), 0);

  // Caso abierto en el panel de gestión (?c=...): solo para ese se calculan las sugerencias de proveedores.
  const sel = filas.find((x) => x.id === sp.c);
  const puedeSugerir = sel && !ESTADOS_CERRADOS.includes(sel.estado) && sel.whatsapp && sel.version;
  const sugeridos = new Map(
    puedeSugerir ? [[sel.id, await sugerirProveedores({ categoriaSlug: sel.categoriaSlug, texto: sel.texto, localidadSlug: sel.localidadSlug, punto: !sel.localidad && sel.lat != null && sel.lng != null ? { lat: sel.lat, lng: sel.lng } : null })] as const] : [],
  );

  return (
    <>
      <Encabezado titulo="Solicitudes de clientes" subtitulo="Seguimiento de cada caso: a quién se le pidió que contacte al cliente, cuándo se le avisó y qué sigue. Solo tú lo ves.">
        <a href={exportar} className={botonBorde}>Exportar CSV · queda auditado</a>
      </Encabezado>

      <main className="flex flex-col gap-4 px-5 pb-10 pt-6 lg:px-8">
        {porEnviar.length > 0 && (
          <section className={`${tarjeta} flex flex-col gap-3 border-2 border-tinta p-[18px]`}>
            <h2 className="font-display text-xl font-bold">Calificaciones por enviar ({porEnviar.length})</h2>
            <p className="text-sm text-tinta-2">El proveedor marcó el servicio como prestado y el cliente no tiene correo: envíale por WhatsApp la invitación a calificar. Cuando el envío sea automático, esta lista desaparece.</p>
            {porEnviar.map((p) => (
              <div key={p.servicioId} className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-piedra p-3.5">
                <span className="flex flex-col text-[15px]"><b>{p.cliente ?? "Cliente"} → {p.proveedor}</b><span className="text-[13px] text-gris">Servicio prestado el {fecha(p.prestadoEn)} · código {p.codigo}</span></span>
                <span className="flex gap-2">
                  {p.whatsapp ? <a href={enlaceConMensaje(p.whatsapp, p.mensaje)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-verde px-4 text-sm font-semibold text-white hover:bg-verde-oscuro">Enviar por WhatsApp</a> : <span className="text-sm text-gris">Sin WhatsApp del cliente</span>}
                  <form action={marcarCalificacionEnviadaPorWhatsapp}><input type="hidden" name="servicioId" value={p.servicioId} /><input type="hidden" name="volver" value={volver} /><button type="submit" className={botonBorde}>Ya lo envié</button></form>
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Atajos y filtros */}
        <form className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[200px] flex-[1_1_220px] flex-col gap-1 text-xs font-semibold text-gris">Buscar<input name="q" type="search" defaultValue={sp.q} placeholder="Nombre, WhatsApp o texto" className={campoAdmin} /></label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gris">Estado
            <select name="estado" defaultValue={sp.estado ?? ""} className={campoAdmin}><option value="">Todos</option>{ESTADOS_SOLICITUD.map(([v, e]) => <option key={v} value={v}>{e} ({conteos.porEstado[v] ?? 0})</option>)}</select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gris">WhatsApp
            <select name="wa" defaultValue={sp.wa ?? ""} className={campoAdmin}><option value="">Todos</option><option value="con">Dejó WhatsApp</option><option value="sin">No dejó WhatsApp</option></select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gris">Resultados
            <select name="sin" defaultValue={sp.sin ?? ""} className={campoAdmin}><option value="">Todos</option><option value="1">Sin proveedores</option></select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gris">Desde<input type="date" name="desde" defaultValue={sp.desde ?? ""} className={campoAdmin} /></label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gris">Hasta<input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className={campoAdmin} /></label>
          <button type="submit" className="h-11 rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Filtrar</button>
          <Link href="/admin/solicitudes" className="flex h-11 items-center px-2 text-sm font-semibold text-verde underline">Ver todas</Link>
        </form>

        {demanda && (
          <p className="flex flex-wrap items-center gap-3 rounded-2xl bg-amarillo-suave p-3 text-sm">
            <span>Viene de <b>Demanda sin cubrir</b>: {filas.length} solicitud{filas.length === 1 ? "" : "es"} de «{filas[0]?.categoria ?? sp.dt ?? "Sin especificar"}» en {filas[0]?.localidad ?? "cualquier localidad"}.</span>
            <Link href="/admin/solicitudes" className="font-semibold text-verde underline">Quitar filtro</Link>
          </p>
        )}

        <p className="text-sm text-gris">
          {visibles.length} solicitud{visibles.length === 1 ? "" : "es"} · <Link href={ruta({ vencidas: sp.vencidas === "1" ? null : "1" })} className="font-semibold text-verde underline">{sp.vencidas === "1" ? "Quitar «vencidas»" : `Solo vencidas (${conteos.vencidas})`}</Link> · <Link href={ruta({ mios: sp.mios === "1" ? null : "1" })} className="font-semibold text-verde underline">{sp.mios === "1" ? "Quitar «mías»" : `Solo mías (${conteos.mios})`}</Link>
        </p>

        <div className={`${tarjeta} overflow-x-auto`}>
          <table className="w-full min-w-[1400px] border-collapse text-xs">
            <thead>
              <tr className="bg-crema text-left text-gris">
                {["Fecha", "Cliente", "WhatsApp", "Qué busca", "Servicio", "Ubicación", "Proveedores mostrados", "Autoriz.", "Estado", "Responsable", "Próx. acción", "Contactó a", "Origen", ""].map((h) => <th key={h || "acc"} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && <tr><td colSpan={14} className="px-3 py-8 text-center text-[15px] text-gris">No hay solicitudes con esos filtros.</td></tr>}
              {visibles.map((x) => {
                const [, etiquetaEstado, tonoEstado] = datosEstado(x.estado);
                const cerr = ESTADOS_CERRADOS.includes(x.estado);
                const venc = !cerr && x.proximaAccion != null && x.proximaAccion <= hoy;
                return (
                  <tr key={x.id} className={`border-t border-borde-suave align-top ${x.id === sel?.id ? "bg-piedra" : ""}`}>
                    <td className="whitespace-nowrap px-3 py-2">{fecha(x.creada)}</td>
                    <td className="px-3 py-2 font-semibold">{x.nombre ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">{x.whatsapp ? `+${x.whatsapp}` : <span className="text-gris">No dejó</span>}</td>
                    <td className="max-w-[240px] px-3 py-2">{x.texto ?? "—"}</td>
                    <td className="px-3 py-2">{x.categoria ?? "—"}{!x.demanda && <span className="block text-ladrillo-oscuro">No ofrecido</span>}</td>
                    <td className="px-3 py-2">{x.localidad ?? x.direccion ?? (x.lat != null ? "Ubicación compartida" : "—")}</td>
                    <td className="max-w-[200px] px-3 py-2">{x.resultados === 0 ? <span className="font-semibold text-ladrillo-oscuro">Ninguno</span> : <>{x.resultados ?? "—"}{x.mostrados && x.mostrados.length > 0 && <span className="block text-gris">{x.mostrados.map((m) => m.nombre).slice(0, 3).join(" · ")}</span>}</>}</td>
                    <td className="whitespace-nowrap px-3 py-2">{x.version ? `Sí · v${x.version}` : "No"}</td>
                    <td className="px-3 py-2"><Chip tono={tonoEstado}>{etiquetaEstado}</Chip></td>
                    <td className="whitespace-nowrap px-3 py-2">{x.responsable ?? "—"}</td>
                    <td className={`whitespace-nowrap px-3 py-2 ${venc ? "font-semibold text-ladrillo-oscuro" : ""}`}>{x.proximaAccion ? dia(x.proximaAccion) : "—"}</td>
                    <td className="max-w-[180px] px-3 py-2">{x.contactos.length === 0 ? "—" : x.contactos.map((c) => c.proveedor).join(", ")}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gris">{x.origen ?? "web"}</td>
                    <td className="px-3 py-2"><Link href={`${ruta({ c: x.id })}#caso`} className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border-[1.5px] border-tinta px-3 font-semibold">Gestionar</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sel && (() => {
          const cerrada = ESTADOS_CERRADOS.includes(sel.estado);
          const vencida = !cerrada && sel.proximaAccion != null && sel.proximaAccion <= hoy;
          const servicio = sel.categoria ?? sel.texto ?? "un servicio";
          const cliente = sel.nombre ?? "";
          const propios = sugeridos.get(sel.id) ?? [];
          const eventos = historial.get(sel.id) ?? [];
          const mia = sel.responsableId === user.id;
          const s = sel;
          return (
            <section id="caso" aria-label="Gestión del caso" className={`${tarjeta} flex scroll-mt-4 flex-col gap-3 p-[18px] ${vencida ? "border-2 border-ladrillo" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold">{s.nombre ?? "Sin nombre"}{s.whatsapp ? ` · +${s.whatsapp}` : ""}</h2>
                <Link href={volverSinCaso} className="text-sm font-semibold text-verde underline">Cerrar panel</Link>
              </div>
              <p className="text-[15px] text-tinta-2">{s.texto ? `«${s.texto}»` : "Sin texto"}{s.categoria ? ` · ${s.categoria}` : ""}</p>
              <div className="flex max-w-3xl flex-col gap-3">
              {/* Contactar proveedores cercanos: el botón abre WhatsApp con el mensaje listo; «Ya le escribí» deja el registro. */}
              {!cerrada && s.whatsapp && s.version && (
                <section aria-label="Proveedores cercanos" className="flex flex-col gap-2 rounded-2xl bg-piedra p-3.5">
                  <b className="text-[15px]">Pedirle a un proveedor cercano que lo contacte</b>
                  {propios.length === 0 ? (
                    <p className="text-sm text-tinta-2">No hay proveedores publicados de este servicio. Busca uno por fuera y regístrate el contacto en la nota, o ciérralo como «Sin proveedor».</p>
                  ) : (
                    <>
                      {!propios[0]!.cerca && <p className="text-[13px] text-tinta-2">Ninguno atiende su zona; estos son los mejor calificados del servicio en Bogotá.</p>}
                      {propios.map((p) => {
                        const ya = eventos.some((e) => e.tipo === "proveedor" && e.proveedor === p.nombre);
                        return (
                          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-white p-3">
                            <span className="flex flex-col text-[15px]"><b>{p.nombre}</b><span className="text-[13px] text-gris">{p.zonas.join(", ") || "Bogotá"}{ya && " · ya contactado"}</span></span>
                            <span className="flex flex-wrap gap-2">
                              <a href={enlaceConMensaje(p.whatsapp, whatsappPedirAProveedor({ proveedor: p.nombre, cliente: cliente || "Un cliente", servicio: servicio.toLowerCase(), lugar: s.lugar, whatsappCliente: s.whatsapp! }))} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-verde px-4 text-sm font-semibold text-white hover:bg-verde-oscuro">Escribirle al proveedor</a>
                              <form action={registrarProveedorContactado}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="proveedorId" value={p.id} /><input type="hidden" name="volver" value={volver} /><button type="submit" className={botonBorde}>Ya le escribí</button></form>
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </section>
              )}

              {/* Avisarle al cliente */}
              {s.whatsapp && !cerrada && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {(() => {
                    const ultimo = eventos.find((e) => e.tipo === "proveedor");
                    const msg = ultimo?.proveedor ? whatsappAvisarCliente({ cliente, servicio: servicio.toLowerCase(), proveedor: ultimo.proveedor }) : whatsappSinProveedor({ cliente, servicio: servicio.toLowerCase() });
                    return <a href={enlaceConMensaje(s.whatsapp!, msg)} target="_blank" rel="noopener noreferrer" className={botonBorde}>{ultimo?.proveedor ? "Avisarle al cliente que ya contactamos a un proveedor" : "Escribirle al cliente"}</a>;
                  })()}
                  <form action={registrarClienteAvisado}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} /><button type="submit" className={botonBorde}>Ya le escribí al cliente</button></form>
                </div>
              )}

              {/* Gestión del caso */}
              <div className="flex flex-col gap-3 border-t border-[#EAE3D5] pt-3">
                <form action={tomarSolicitud}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} /><button type="submit" className={mia ? botonBorde : botonOscuro}>{mia ? "Soltar caso" : "Tomar caso"}</button></form>
                <form action={programarAccionSolicitud} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} />
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Próxima acción<input type="date" name="fecha" min={hoy} defaultValue={s.proximaAccion ?? ""} className={`${campoAdmin} w-[160px]`} /></label>
                  <button type="submit" className={botonBorde}>Guardar fecha</button>
                </form>
                <form action={cambiarEstadoSolicitud} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} />
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Estado
                    <select name="estado" defaultValue={s.estado} className={`${campoAdmin} w-full`}>{ESTADOS_SOLICITUD.map(([v, e]) => <option key={v} value={v}>{e}</option>)}</select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Nota (opcional)<input name="nota" maxLength={500} className={`${campoAdmin} w-full`} /></label>
                  <button type="submit" className={botonBorde}>Cambiar estado</button>
                </form>
              </div>

              {/* Bitácora */}
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold">Bitácora ({eventos.length})</summary>
                <form action={agregarNotaSolicitud} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} />
                  <label className="sr-only" htmlFor={`nota-${s.id}`}>Nota</label>
                  <input id={`nota-${s.id}`} name="nota" required maxLength={500} placeholder="Agregar una nota al caso" className={campoAdmin} />
                  <button type="submit" className={botonBorde}>Agregar</button>
                </form>
                {eventos.length === 0 ? <p className="mt-2 text-gris">Aún no hay movimientos.</p> : (
                  <ol className="mt-2 flex flex-col gap-2">
                    {eventos.map((e, i) => (
                      <li key={i} className="rounded-xl bg-piedra px-3 py-2">
                        <b>{textoEvento(e)}</b> <span className="text-[13px] text-gris">· {e.autor} · {fecha(e.cuando)}</span>
                        {e.nota && <span className="block text-tinta-2">{e.nota}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </details>
              </div>
            </section>
          );
        })()}
      </main>
    </>
  );
}
