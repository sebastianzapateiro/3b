import { notFound } from "next/navigation";
import { botonBorde, Chip, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { enlaceConMensaje } from "@las3b/shared";
import { listarSolicitudes } from "@/lib/solicitudes";
import { exigirBackoffice } from "@/lib/verificacion";
import { calificacionesPorEnviar } from "@/lib/servicios-prestados";
import { cambiarEstadoSolicitud, marcarCalificacionEnviadaPorWhatsapp } from "./actions";

/** B7 · Solicitudes de clientes («¿Qué estás buscando?»): quién pidió qué, qué se le mostró y a quién contactó. Solo administradores. */
const fecha = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

export default async function Solicitudes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles } = await exigirBackoffice();
  if (!roles.includes("admin")) notFound();
  const sp = await searchParams;
  const filtro = { estado: sp.estado, sinResultado: sp.sin === "1", q: sp.q };
  const [filas, porEnviar] = await Promise.all([listarSolicitudes(filtro), calificacionesPorEnviar()]);
  const exportar = `/admin/solicitudes/exportar?${new URLSearchParams(Object.entries({ estado: sp.estado, sin: sp.sin, q: sp.q }).filter((e): e is [string, string] => Boolean(e[1])))}`;

  return (
    <>
      <Encabezado titulo="Solicitudes de clientes" subtitulo="Lo que piden en «¿Qué estás buscando?», con los contactos que generan. Solo tú lo ves.">
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
                  <form action={marcarCalificacionEnviadaPorWhatsapp}><input type="hidden" name="servicioId" value={p.servicioId} /><button type="submit" className={botonBorde}>Ya lo envié</button></form>
                </span>
              </div>
            ))}
          </section>
        )}

        <form className="flex flex-wrap gap-2.5">
          <label htmlFor="q" className="sr-only">Buscar</label>
          <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Nombre, WhatsApp o texto" className={`${campoAdmin} flex-[1_1_220px]`} />
          <label htmlFor="estado" className="sr-only">Estado</label>
          <select id="estado" name="estado" defaultValue={sp.estado ?? ""} className={`${campoAdmin} flex-[0_1_170px]`}><option value="">Todas</option><option value="nueva">Nuevas</option><option value="avisada">Avisadas</option></select>
          <label className="flex h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="sin" value="1" defaultChecked={sp.sin === "1"} className="size-[18px] accent-verde" />Sin proveedores</label>
          <button type="submit" className="h-11 rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Filtrar</button>
        </form>

        {filas.length === 0 && <p className="text-[15px] text-gris">No hay solicitudes con esos filtros.</p>}

        {filas.map((s) => {
          const aviso = `Hola ${s.nombre ?? ""}, te escribimos de LasTresB por tu solicitud: "${s.texto ?? s.categoria ?? "un servicio"}". Estos son los proveedores calificados para ti: `;
          return (
            <article key={s.id} className={`${tarjeta} flex flex-col gap-3 p-[18px]`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <b className="text-base">{s.nombre ?? "Sin nombre"}</b>
                  <Chip tono={s.estado === "nueva" ? "amarillo" : "verde"}>{s.estado === "nueva" ? "Nueva" : "Avisada"}</Chip>
                  {s.resultados === 0 && <Chip tono="rojo">Sin proveedores</Chip>}
                  {!s.demanda && <Chip tono="gris">Servicio no ofrecido</Chip>}
                </span>
                <span className="text-[13px] text-gris">{fecha(s.creada)} · {s.origen ?? "web"}</span>
              </div>
              <dl className="grid gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-[170px_minmax(0,1fr)]">
                <dt className="text-gris">WhatsApp</dt><dd>+{s.whatsapp}</dd>
                <dt className="text-gris">Qué busca</dt><dd>{s.texto ? `«${s.texto}»` : "—"}{s.categoria && <span className="text-gris"> · {s.categoria}</span>}</dd>
                <dt className="text-gris">Ubicación del servicio</dt><dd>{s.localidad ? `Por localidad: ${s.localidad}` : s.direccion ? `Exacta: ${s.direccion}` : s.lat != null ? "Exacta: ubicación compartida" : "—"}{!s.localidad && s.lat != null && <span className="text-gris"> · medida</span>}</dd>
                <dt className="text-gris">Se le mostraron</dt><dd>{s.resultados ?? "—"} proveedores</dd>
                <dt className="text-gris">Autorización</dt><dd>Política de datos v{s.version ?? "—"}</dd>
                <dt className="text-gris">Contactó a</dt>
                <dd>
                  {s.contactos.length === 0 ? "Aún a nadie" : (
                    <ul className="flex flex-col gap-1.5">{s.contactos.map((c, i) => <li key={i}><b>{c.proveedor}</b> <span className="text-[13px] text-gris">· {fecha(c.cuando)}</span>{c.mensaje && <span className="block text-[13px] text-tinta-2">{c.mensaje}</span>}</li>)}</ul>
                  )}
                </dd>
              </dl>
              <div className="flex flex-wrap gap-2.5">
                <a href={enlaceConMensaje(s.whatsapp ?? "", aviso)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-verde px-4 text-sm font-semibold text-white hover:bg-verde-oscuro">Escribirle por WhatsApp</a>
                <form action={cambiarEstadoSolicitud}>
                  <input type="hidden" name="id" value={s.id} /><input type="hidden" name="estado" value={s.estado === "nueva" ? "avisada" : "nueva"} />
                  <button type="submit" className={botonBorde}>{s.estado === "nueva" ? "Marcar como avisada" : "Volver a nueva"}</button>
                </form>
              </div>
            </article>
          );
        })}
      </main>
    </>
  );
}
