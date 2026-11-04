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

export default async function Solicitudes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles, user } = await exigirBackoffice();
  if (!roles.includes("admin")) notFound();
  const sp = await searchParams;
  const rangoDemanda = (["7", "30", "mes"] as const).find((r) => r === sp.rango) ?? "30";
  const demanda = sp.demanda === "1" ? { oficioSlug: sp.d, texto: sp.dt, localidadSlug: sp.dl && sp.dl !== "-" ? sp.dl : undefined, rango: rangoDemanda } : undefined;
  const filtro = { demanda, estado: sp.estado, sinResultado: sp.sin === "1", q: sp.q, todas: sp.todas === "1", vencidas: sp.vencidas === "1", responsableId: sp.mios === "1" ? user.id : undefined };
  const [filas, porEnviar, conteos] = await Promise.all([listarSolicitudes(filtro), calificacionesPorEnviar(), conteosSeguimiento(user.id)]);
  const historial = await historialDe(filas.map((s) => s.id));
  const hoy = hoyBogota();

  const actuales = Object.entries({ demanda: sp.demanda, rango: sp.rango, d: sp.d, dt: sp.dt, dl: sp.dl, estado: sp.estado, sin: sp.sin, q: sp.q, todas: sp.todas, vencidas: sp.vencidas, mios: sp.mios }).filter((e): e is [string, string] => Boolean(e[1]));
  const ruta = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams(actuales);
    for (const [k, v] of Object.entries(cambios)) (v == null ? p.delete(k) : p.set(k, v));
    const q = p.toString();
    return `/admin/solicitudes${q ? `?${q}` : ""}`;
  };
  const volver = ruta({});
  const exportar = `/admin/solicitudes/exportar?${new URLSearchParams(actuales.filter(([k]) => ["estado", "sin", "q"].includes(k)))}`;
  const abiertas = ESTADOS_SOLICITUD.filter(([v]) => !ESTADOS_CERRADOS.includes(v)).reduce((n, [v]) => n + (conteos.porEstado[v] ?? 0), 0);

  // Sugerencias de proveedores solo para los casos abiertos que dieron su autorización (se comparten sus datos).
  const abiertosConDatos = filas.filter((s) => !ESTADOS_CERRADOS.includes(s.estado) && s.whatsapp && s.version);
  const sugeridos = new Map(
    await Promise.all(abiertosConDatos.map(async (s) => [s.id, await sugerirProveedores({ categoriaSlug: s.categoriaSlug, texto: s.texto, localidadSlug: s.localidadSlug, punto: !s.localidad && s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : null })] as const)),
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

        {/* Tablero: pestañas por estado y atajos */}
        <nav aria-label="Estados" className="flex flex-wrap gap-2">
          <Link href={ruta({ estado: null, vencidas: null, mios: null })} className={`${pestana} ${!sp.estado && sp.vencidas !== "1" && sp.mios !== "1" ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white"}`}>Abiertos <span className="opacity-70">{abiertas}</span></Link>
          <Link href={ruta({ vencidas: "1", estado: null, mios: null })} className={`${pestana} ${sp.vencidas === "1" ? "border-ladrillo bg-ladrillo text-white" : "border-borde-campo bg-white"}`}>Vencidos <span className="opacity-70">{conteos.vencidas}</span></Link>
          <Link href={ruta({ mios: "1", estado: null, vencidas: null })} className={`${pestana} ${sp.mios === "1" ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white"}`}>Míos <span className="opacity-70">{conteos.mios}</span></Link>
          {ESTADOS_SOLICITUD.map(([v, etiqueta]) => (
            <Link key={v} href={ruta({ estado: v, vencidas: null, mios: null })} className={`${pestana} ${sp.estado === v ? "border-tinta bg-tinta text-white" : "border-borde-campo bg-white"}`}>{etiqueta} <span className="opacity-70">{conteos.porEstado[v] ?? 0}</span></Link>
          ))}
        </nav>

        <form className="flex flex-wrap gap-2.5">
          {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
          {sp.vencidas && <input type="hidden" name="vencidas" value={sp.vencidas} />}
          {sp.mios && <input type="hidden" name="mios" value={sp.mios} />}
          <label htmlFor="q" className="sr-only">Buscar</label>
          <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Nombre, WhatsApp o texto" className={`${campoAdmin} flex-[1_1_220px]`} />
          <label className="flex h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="sin" value="1" defaultChecked={sp.sin === "1"} className="size-[18px] accent-verde" />Sin proveedores</label>
          <label className="flex h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="todas" value="1" defaultChecked={sp.todas === "1"} className="size-[18px] accent-verde" />Incluir búsquedas sin WhatsApp</label>
          <button type="submit" className="h-11 rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Filtrar</button>
        </form>

        {demanda && (
          <p className="flex flex-wrap items-center gap-3 rounded-2xl bg-amarillo-suave p-3.5 text-[15px]">
            <span>Viene de <b>Demanda sin cubrir</b>: {filas.length} solicitud{filas.length === 1 ? "" : "es"} de «{filas[0]?.categoria ?? sp.dt ?? "Sin especificar"}» en {filas[0]?.localidad ?? "cualquier localidad"}, {rangoDemanda === "mes" ? "este mes" : `últimos ${rangoDemanda} días`}.</span>
            <Link href="/admin/solicitudes" className="font-semibold text-verde underline">Quitar filtro</Link>
          </p>
        )}

        {filas.length === 0 && <p className="text-[15px] text-gris">No hay solicitudes con esos filtros.</p>}

        {filas.map((s) => {
          const [, etiquetaEstado, tono] = datosEstado(s.estado);
          const cerrada = ESTADOS_CERRADOS.includes(s.estado);
          const vencida = !cerrada && s.proximaAccion != null && s.proximaAccion <= hoy;
          const servicio = s.categoria ?? s.texto ?? "un servicio";
          const cliente = s.nombre ?? "";
          const propios = sugeridos.get(s.id) ?? [];
          const eventos = historial.get(s.id) ?? [];
          const mia = s.responsableId === user.id;
          return (
            <article key={s.id} className={`${tarjeta} flex flex-col gap-3 p-[18px] ${vencida ? "border-2 border-ladrillo" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-base">{s.nombre ?? "Sin nombre"}</b>
                  <Chip tono={tono}>{etiquetaEstado}</Chip>
                  {s.resultados === 0 && <Chip tono="rojo">Sin proveedores</Chip>}
                  {!s.demanda && <Chip tono="gris">Servicio no ofrecido</Chip>}
                  {vencida && <Chip tono="rojo">Acción vencida</Chip>}
                </span>
                <span className="text-[13px] text-gris">{fecha(s.creada)} · {s.origen ?? "web"}</span>
              </div>
              <dl className="grid gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-[170px_minmax(0,1fr)]">
                <dt className="text-gris">WhatsApp</dt><dd>{s.whatsapp ? `+${s.whatsapp}` : "No dejó WhatsApp"}</dd>
                <dt className="text-gris">Qué busca</dt><dd>{s.texto ? `«${s.texto}»` : "—"}{s.categoria && <span className="text-gris"> · {s.categoria}</span>}</dd>
                <dt className="text-gris">Ubicación del servicio</dt><dd>{s.localidad ? `Por localidad: ${s.localidad}` : s.direccion ? `Exacta: ${s.direccion}` : s.lat != null ? "Exacta: ubicación compartida" : "—"}{!s.localidad && s.lat != null && <span className="text-gris"> · medida</span>}</dd>
                <dt className="text-gris">Se le mostraron</dt><dd>{s.resultados ?? "—"} proveedores{s.mostrados && s.mostrados.length > 0 && <span className="block text-[13px] text-tinta-2">{s.mostrados.map((p) => p.nombre).join(" · ")}{(s.resultados ?? 0) > s.mostrados.length ? ` · y ${(s.resultados ?? 0) - s.mostrados.length} más` : ""}</span>}</dd>
                <dt className="text-gris">Autorización</dt><dd>{s.version ? `Política de datos v${s.version}` : "Sin autorización: no se comparten sus datos"}</dd>
                <dt className="text-gris">Responsable</dt><dd>{s.responsable ?? "Sin asignar"}</dd>
                <dt className="text-gris">Próxima acción</dt><dd className={vencida ? "font-semibold text-ladrillo-oscuro" : ""}>{s.proximaAccion ? dia(s.proximaAccion) : "Sin fecha"}</dd>
                <dt className="text-gris">Contactó a</dt>
                <dd>
                  {s.contactos.length === 0 ? "Aún a nadie" : (
                    <ul className="flex flex-col gap-1.5">{s.contactos.map((c, i) => <li key={i}><b>{c.proveedor}</b> <span className="text-[13px] text-gris">· {fecha(c.cuando)}</span>{c.mensaje && <span className="block text-[13px] text-tinta-2">{c.mensaje}</span>}</li>)}</ul>
                  )}
                </dd>
              </dl>

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
              <div className="flex flex-wrap items-end gap-2.5 border-t border-[#EAE3D5] pt-3">
                <form action={tomarSolicitud}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} /><button type="submit" className={mia ? botonBorde : botonOscuro}>{mia ? "Soltar caso" : "Tomar caso"}</button></form>
                <form action={programarAccionSolicitud} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} />
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Próxima acción<input type="date" name="fecha" min={hoy} defaultValue={s.proximaAccion ?? ""} className={`${campoAdmin} w-[160px]`} /></label>
                  <button type="submit" className={botonBorde}>Guardar fecha</button>
                </form>
                <form action={cambiarEstadoSolicitud} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="volver" value={volver} />
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Estado
                    <select name="estado" defaultValue={s.estado} className={`${campoAdmin} w-[200px]`}>{ESTADOS_SOLICITUD.map(([v, e]) => <option key={v} value={v}>{e}</option>)}</select>
                  </label>
                  <label className="flex flex-col gap-1 text-[13px] font-semibold text-gris">Nota (opcional)<input name="nota" maxLength={500} className={`${campoAdmin} w-[220px]`} /></label>
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
            </article>
          );
        })}
      </main>
    </>
  );
}
