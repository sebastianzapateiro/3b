import { PARAMETROS } from "@las3b/shared";
import { Aviso, botonBorde, Encabezado, tarjeta } from "@/components/admin/Ui";
import { alertaDocumentos, ETIQUETA_ACCION, FILTROS_ACCION, listarAuditoria } from "@/lib/auditoria-consulta";
import { todosLosParametros } from "@/lib/parametros";
import { exigirBackoffice } from "@/lib/verificacion";
import { guardarParametros } from "./actions";

/** B8 · Auditoría (solo lectura) y parámetros configurables. Mockup: docs/mockups/BO_Auditoria.dc.html. */
const hora = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export default async function Auditoria({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { roles } = await exigirBackoffice();
  const esAdmin = roles.includes("admin");
  const sp = await searchParams;
  const filtro = { usuario: sp.usuario, accion: sp.accion, desde: sp.desde };
  const [filas, alerta, parametros] = await Promise.all([listarAuditoria(filtro), alertaDocumentos(), todosLosParametros()]);
  const grupos = [...new Set(PARAMETROS.map((p) => p.grupo))];
  const exportar = `/admin/auditoria/exportar?${new URLSearchParams(Object.entries(filtro).filter((e): e is [string, string] => Boolean(e[1])))}`;
  const campo = "h-[42px] rounded-[10px] border-[1.5px] border-borde-campo bg-white px-3 text-sm";

  return (
    <>
      <Encabezado titulo="Auditoría y parámetros" subtitulo="El registro solo admite inserciones: nadie puede editarlo ni borrarlo">
        {esAdmin && <a href={exportar} className={botonBorde}>Exportar CSV · queda auditado</a>}
      </Encabezado>

      <main className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        <section className="flex min-w-0 flex-[3_1_560px] flex-col gap-3.5">
          <form className="flex flex-wrap gap-2.5">
            <label htmlFor="usuario" className="sr-only">Usuario</label>
            <input id="usuario" name="usuario" type="search" defaultValue={sp.usuario} placeholder="Usuario o correo" className={`${campo} flex-[1_1_180px]`} />
            <label htmlFor="accion" className="sr-only">Acción</label>
            <select id="accion" name="accion" defaultValue={sp.accion ?? "todas"} className={`${campo} flex-[1_1_180px]`}>{Object.entries(FILTROS_ACCION).map(([v, a]) => <option key={v} value={v}>{a.texto}</option>)}</select>
            <label htmlFor="desde" className="sr-only">Desde</label>
            <input id="desde" name="desde" type="date" defaultValue={sp.desde} className={`${campo} flex-[0_1_170px]`} />
            <button type="submit" className="h-[42px] rounded-[10px] bg-tinta px-4 text-sm font-semibold text-white">Filtrar</button>
          </form>

          <Aviso ok={sp.ok} error={sp.error} />
          {alerta && <p role="alert" className="rounded-xl bg-[#F9E1DB] px-3.5 py-3 text-sm leading-[1.45] text-ladrillo-oscuro"><b>Alerta:</b> {alerta.nombre ?? "Alguien"} abrió {alerta.n} documentos entre las {hora(alerta.desde)} y las {hora(alerta.hasta)} (umbral: 30 por hora).</p>}

          <div className={`${tarjeta} overflow-x-auto`}>
            <table className="w-full min-w-[760px] border-collapse text-sm tabular-nums">
              <thead><tr className="bg-crema text-left text-gris"><th className="px-[18px] py-3 font-semibold">Fecha</th><th className="p-3 font-semibold">Quién</th><th className="p-3 font-semibold">Acción</th><th className="p-3 font-semibold">Sobre</th><th className="p-3 font-semibold">Resultado</th><th className="p-3 font-semibold">IP</th></tr></thead>
              <tbody>
                {filas.length === 0 && <tr><td colSpan={6} className="px-[18px] py-8 text-center text-gris">No hay registros con esos filtros.</td></tr>}
                {filas.map((f) => (
                  <tr key={f.id} className="border-t border-borde-suave align-top">
                    <td className="px-[18px] py-3 text-gris">{hora(f.fecha)}</td>
                    <td className="p-3">{f.quien ?? f.correo ?? "Sistema"} {f.rol && <span className="text-gris">· {f.rol}</span>}</td>
                    <td className="p-3 font-semibold">{ETIQUETA_ACCION[f.accion] ?? f.accion}</td>
                    <td className="p-3">{[f.objetoTipo, f.objetoId?.slice(0, 36)].filter(Boolean).join(" · ") || "—"}{f.motivo && <span className="block text-gris">{f.motivo}</span>}</td>
                    <td className={`p-3 ${f.resultado && f.resultado !== "ok" && /fall/i.test(f.resultado) ? "font-semibold text-ladrillo-oscuro" : ""}`}>{f.resultado ?? "—"}</td>
                    <td className="p-3 text-gris">{f.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-gris">Se muestran los 200 registros más recientes con los filtros aplicados.</p>
        </section>

        <form action={guardarParametros} className={`${tarjeta} flex min-w-0 flex-[2_1_340px] flex-col gap-3.5 p-[22px]`}>
          <h2 className="font-display text-xl font-bold">Parámetros</h2>
          <span className="text-[13px] text-gris">Valores de las decisiones y propuestas del Drive. Cambiarlos queda en la auditoría.{!esAdmin && " Solo un administrador puede modificarlos."}</span>
          <div className="flex flex-col gap-2.5 text-sm tabular-nums">
            {grupos.map((g, i) => (
              <div key={g} className="flex flex-col gap-2.5">
                <b className={`text-[13px] uppercase tracking-[1px] text-gris ${i ? "mt-1.5" : ""}`}>{g}</b>
                {parametros.filter((p) => p.grupo === g).map((p) => (
                  <label key={p.clave} className="flex items-center justify-between gap-2.5">{p.etiqueta}
                    <input type="number" min={0} name={p.clave} defaultValue={p.valor ?? ""} placeholder="[N]" disabled={!esAdmin} className="h-[38px] w-[72px] rounded-[10px] border-[1.5px] border-borde-campo text-center text-sm disabled:bg-piedra" />
                  </label>
                ))}
              </div>
            ))}
          </div>
          {esAdmin && <button type="submit" className="h-11 self-end rounded-xl bg-tinta px-5 text-[15px] font-bold text-white">Guardar parámetros</button>}
        </form>
      </main>
    </>
  );
}
