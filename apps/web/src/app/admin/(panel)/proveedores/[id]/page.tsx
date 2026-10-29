import { notFound } from "next/navigation";
import { abrirDocumento, aprobarProveedor, rechazarProveedor } from "@/app/admin/actions";
import { Aviso, Chip, Encabezado, Iniciales, tarjeta, campoAdmin } from "@/components/admin/Ui";
import { etiquetaSegmento, obtenerRevision } from "@/lib/admin";
import { MOTIVOS_RECHAZO } from "@/lib/motivos-rechazo";

/** B1, B2 · Revisión de proveedor, documentos, decisión e insignias. Mockup: docs/mockups/BO_Revision.dc.html. */
const ESTADO: Record<string, { texto: string; tono: "amarillo" | "verde" | "rojo" | "gris" }> = {
  pendiente: { texto: "Pendiente", tono: "amarillo" },
  aprobado: { texto: "Aprobado", tono: "verde" },
  en_revision: { texto: "En revisión", tono: "amarillo" },
  rechazado: { texto: "Rechazado", tono: "rojo" },
  borrador: { texto: "Borrador", tono: "gris" },
  pausado: { texto: "Pausado", tono: "gris" },
  pausado_por_rut: { texto: "Pausado por RUT", tono: "gris" },
  suspendido: { texto: "Suspendido", tono: "rojo" },
};

const TIPO_DOC: Record<string, string> = {
  documento_frente: "Cédula · frente",
  documento_reverso: "Cédula · reverso",
  rut: "RUT",
  camara_comercio: "Cámara de comercio",
  matricula: "Matrícula",
  autorizacion_ley_1918: "Autorización Ley 1918",
  portafolio: "Portafolio",
};

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} MB`;
const fecha = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
const ACCIONES: Record<string, string> = {
  documento_abierto: "Se abrió un documento",
  proveedor_aprobado: "Aprobado y publicado",
  proveedor_rechazado: "Rechazado",
  alta_asistida: "Alta asistida por el equipo",
};

export default async function Revision({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await obtenerRevision(id);
  if (!p) notFound();

  const estado = ESTADO[p.estado] ?? { texto: p.estado, tono: "gris" as const };
  const exigidos = [
    { tipo: "documento_frente", nombre: "Cédula · frente" },
    { tipo: "documento_reverso", nombre: "Cédula · reverso" },
    ...(p.categorias.some((c) => c.matricula) ? [{ tipo: "matricula", nombre: "Matrícula" }] : []),
    ...(p.segmento !== "independiente_sin_rut" || p.categorias.some((c) => c.rut) ? [{ tipo: "rut", nombre: "RUT" }] : []),
    ...(p.segmento === "empresa" ? [{ tipo: "camara_comercio", nombre: "Cámara de comercio" }] : []),
    ...(p.categorias.some((c) => c.menores) ? [{ tipo: "autorizacion_ley_1918", nombre: "Autorización Ley 1918" }] : []),
  ];
  const aplicaMenores = p.categorias.some((c) => c.menores);
  const tieneRut = p.insignias.some((i) => i.clave === "formalizado");
  const abierto = p.documentos.find((d) => d.id === sp.doc);
  const puedeDecidir = p.estado === "pendiente" || p.estado === "en_revision" || p.estado === "borrador";

  return (
    <>
      <Encabezado
        atras={{ href: "/admin/aprobaciones", texto: "Aprobaciones" }}
        titulo={
          <span className="flex flex-wrap items-center gap-3.5">
            <Iniciales nombre={p.nombre} className="size-[52px] rounded-[14px] text-xl font-extrabold" />
            <span className="flex flex-col gap-1">
              <span className="text-[28px]">{p.nombre}</span>
              <span className="flex flex-wrap items-center gap-2 font-sans text-sm font-normal tracking-normal text-gris">
                <Chip tono={estado.tono}>{estado.texto}</Chip>
                {etiquetaSegmento(p.segmento)} · {p.categorias.map((c) => c.nombre).join(", ") || "Sin categorías"} · {p.localidades.join(", ") || "Sin localidades"}
              </span>
            </span>
          </span>
        }
      />

      <main className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
          <Aviso ok={sp.ok} error={sp.error} />

          <section className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Datos del alta</h2>
            <dl className="grid gap-x-4 gap-y-2.5 text-[15px] sm:grid-cols-[200px_minmax(0,1fr)]">
              <dt className="text-gris">Nombre público</dt><dd>{p.nombre}</dd>
              <dt className="text-gris">Documento</dt><dd>{p.tipoDocumento?.toUpperCase() ?? "—"} {p.documentoMascara} <span className="text-[13px] text-gris">· la lectura completa se audita</span></dd>
              <dt className="text-gris">Fecha de nacimiento</dt>
              <dd>{p.fechaNacimiento ?? "—"}{p.mayorDeEdad !== null && <> · <b className={p.mayorDeEdad ? "text-verde-oscuro" : "text-ladrillo-oscuro"}>{p.mayorDeEdad ? "mayor de edad" : "menor de edad"}</b></>}</dd>
              <dt className="text-gris">Dirección de notificaciones</dt><dd>{p.direccion ?? "—"}</dd>
              <dt className="text-gris">WhatsApp</dt><dd>{p.whatsappMascara}</dd>
              <dt className="text-gris">Correo</dt>
              <dd>{p.correo && !p.correo.endsWith(".invalid") ? p.correo : "Sin correo"} {p.correoVerificado && <span className="font-semibold text-verde-oscuro">· verificado</span>}</dd>
              <dt className="text-gris">Respuestas del segmento</dt>
              <dd>{etiquetaSegmento(p.segmento)} · {p.emiteFactura ? "emite factura" : "no emite factura"}{p.rutFechaLimite && ` · plazo de RUT hasta ${p.rutFechaLimite}`}</dd>
            </dl>
          </section>

          <section className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold">Documentos privados</h2>
              <span className="text-[13px] text-gris">Cada apertura queda en la auditoría con tu nombre e IP</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {exigidos.map((e) => {
                const d = p.documentos.find((x) => x.tipo === e.tipo);
                return d ? (
                  <div key={e.tipo} className={`flex flex-[1_1_220px] flex-col gap-2 rounded-2xl p-3.5 ${abierto?.id === d.id ? "border-2 border-verde" : "border border-[#EAE3D5]"}`}>
                    <b className="text-[15px]">{e.nombre}</b>
                    <span className="text-[13px] text-gris">{d.mime.split("/")[1]?.toUpperCase()} · {mb(d.bytes)}{abierto?.id === d.id && " · abierto ahora"}</span>
                    <form action={abrirDocumento}>
                      <input type="hidden" name="proveedorId" value={p.id} />
                      <input type="hidden" name="documentoId" value={d.id} />
                      <button type="submit" className="h-9 rounded-[10px] border-[1.5px] border-borde-campo bg-white px-3 text-[13px] font-semibold">Abrir</button>
                    </form>
                  </div>
                ) : (
                  <div key={e.tipo} className="flex flex-[1_1_220px] flex-col gap-2 rounded-2xl border-[1.5px] border-dashed border-ladrillo-claro bg-[#FDF3F0] p-3.5">
                    <b className="text-[15px]">{e.nombre}</b>
                    <span className="text-[13px] font-semibold text-ladrillo-oscuro">Falta · lo exige su segmento o categoría</span>
                  </div>
                );
              })}
            </div>
            {abierto && (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-[#2A3532] p-4 text-center text-[#DDE3E1]">
                <b className="text-base">{TIPO_DOC[abierto.tipo] ?? abierto.tipo}</b>
                <span className="text-[13px] text-[#A9B4B1]">La apertura quedó registrada en la auditoría. La vista del archivo estará disponible cuando se conecte el almacenamiento privado (URL firmada de 5 min).</span>
              </div>
            )}
          </section>

          <section className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Lista de verificación</h2>
            {[
              "El nombre coincide con el documento",
              "Documento legible y vigente (CC, CE o PPT)",
              "Mayor de edad según la fecha de nacimiento",
              "Documentos exigidos por segmento y categorías completos",
              "Perfil público sin datos personales, menores ni suplantación",
            ].map((t) => (
              <label key={t} className="flex items-center gap-2.5 text-[15px]"><input type="checkbox" className="size-5 accent-verde" />{t}</label>
            ))}
          </section>

          <section className={`${tarjeta} flex flex-col gap-2.5 p-[22px]`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold">Así se verá su página</h2>
              <span className="font-mono text-[13px] text-verde-oscuro">lastresb.com.co/{p.slug}</span>
            </div>
            <p className="text-[15px] leading-[1.55] text-tinta-2">{p.presentacion || "Sin presentación."}</p>
            <span className="text-sm text-gris">{p.totalServicios} servicios</span>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section className={`flex flex-col gap-3.5 rounded-[20px] border-2 border-tinta bg-white p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Decisión</h2>
            {puedeDecidir ? (
              <>
                <form action={aprobarProveedor} className="flex flex-col gap-2">
                  <input type="hidden" name="proveedorId" value={p.id} />
                  <button type="submit" className="h-[50px] rounded-xl bg-verde text-base font-bold text-white">Aprobar y publicar</button>
                  <span className="text-[13px] leading-[1.45] text-gris">
                    Otorga la insignia Verificado.{p.segmento === "independiente_sin_rut" && " Como no tiene RUT, se fija el plazo de RUT (parámetro de configuración, 30 días por defecto)."}
                  </span>
                </form>
                <div className="h-px bg-[#EAE3D5]" />
                <form action={rechazarProveedor} className="flex flex-col gap-3">
                  <input type="hidden" name="proveedorId" value={p.id} />
                  <label htmlFor="motivo" className="text-sm font-semibold">Motivo de rechazo</label>
                  <select id="motivo" name="motivo" className={campoAdmin}>
                    {MOTIVOS_RECHAZO.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <label htmlFor="mensaje" className="text-sm font-semibold">Mensaje al proveedor</label>
                  <textarea id="mensaje" name="mensaje" rows={3} placeholder="Ej: Sube la matrícula de gas vigente para poder aparecer en esa categoría." className="rounded-xl border-[1.5px] border-borde-campo p-3 text-[15px] leading-[1.45]" />
                  <button type="submit" className="h-[46px] rounded-xl border-2 border-ladrillo bg-white text-[15px] font-bold text-ladrillo-oscuro">Rechazar con motivo</button>
                  <span className="rounded-lg bg-amarillo-suave px-2.5 py-2 text-xs text-amarillo-oscuro">Lista de motivos: propuesta pendiente del visto bueno de Andrés.</span>
                </form>
              </>
            ) : (
              <p className="text-[15px] text-tinta-2">Este proveedor está en estado «{estado.texto}». La decisión solo aplica a pendientes, en revisión o borradores.</p>
            )}
          </section>

          <section className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Insignias</h2>
            <div className="flex items-center justify-between gap-2.5 text-sm"><span><b>Verificado</b><br /><span className="text-gris">Al aprobar</span></span><span className="text-gris">{p.insignias.some((i) => i.clave === "verificado") ? "Otorgada" : "Automática"}</span></div>
            <div className="flex items-center justify-between gap-2.5 text-sm"><span><b>Formalizado</b><br /><span className="text-gris">Requiere RUT verificado</span></span><Chip tono={tieneRut ? "verde" : "gris"}>{tieneRut ? "Otorgada" : "Sin RUT"}</Chip></div>
            <div className="flex items-center justify-between gap-2.5 text-sm"><span><b>Certificado en su oficio</b><br /><span className="text-gris">Matrícula o certificación</span></span><Chip tono={p.insignias.some((i) => i.clave === "certificado") ? "verde" : "gris"}>{p.insignias.some((i) => i.clave === "certificado") ? "Otorgada" : "Sin soporte"}</Chip></div>
            <div className="flex flex-col gap-2 rounded-[14px] bg-piedra p-3.5 text-sm">
              <b>Apto para menores (Ley 1918)</b>
              {aplicaMenores ? (
                <span className="text-tinta-2">Aplica: ver autorización firmada → consultar el registro de la Policía → registrar resultado y soporte → vence en 6 meses.</span>
              ) : (
                <span className="text-gris">No aplica: no eligió Clases ni Cuidado de personas.</span>
              )}
            </div>
          </section>

          <section className={`${tarjeta} flex flex-col gap-2.5 p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Historial</h2>
            <ol className="flex flex-col gap-2.5 text-sm">
              {p.historial.map((h, i) => (
                <li key={i} className="flex gap-2.5"><span className="mt-1.5 size-2 flex-none rounded-full bg-tinta" /><span>{ACCIONES[h.accion] ?? h.accion}{h.motivo && `: ${h.motivo}`} <span className="text-gris">· {fecha(h.creado)}</span></span></li>
              ))}
              <li className="flex gap-2.5"><span className="mt-1.5 size-2 flex-none rounded-full bg-[#9AA3A0]" /><span>Borrador creado <span className="text-gris">· {fecha(p.creado)}</span></span></li>
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}
