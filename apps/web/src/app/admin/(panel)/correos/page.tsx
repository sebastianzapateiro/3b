import Link from "next/link";
import { CATALOGO_CORREOS, entradaPorAsunto } from "@/lib/correos-catalogo";
import { listarCorreosEnviados } from "@/lib/correos-historial";
import { botonOscuro, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { exigirBackoffice } from "@/lib/verificacion";

/** B1 · Correos del sistema: catálogo (a quién le llega cada uno y cómo se ve) e historial de envíos. Solo Admin (2FA). */
export const metadata = { title: "Correos del sistema" };

const hora = (d: Date) => d.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });
const ESTADO: Record<string, { texto: string; clase: string }> = {
  enviado: { texto: "Enviado", clase: "bg-[#E3F1EC] text-verde" },
  error: { texto: "Con error", clase: "bg-[#F9E3DE] text-ladrillo" },
  simulado: { texto: "Simulado (sin Resend)", clase: "bg-[#F1EDE3] text-gris" },
};
const GRUPOS = ["Cuenta", "Proveedor", "Cliente", "Reclamos y datos", "Equipo"] as const;

export default async function Correos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirBackoffice(true);
  const sp = await searchParams;
  const vista = sp.vista === "historial" ? "historial" : "catalogo";
  const { filas, resumen } = vista === "historial" ? await listarCorreosEnviados({ estado: sp.estado, texto: sp.q }) : { filas: [], resumen: {} as Record<string, number> };

  const pestana = (v: string, t: string) => (
    <Link href={`/admin/correos?vista=${v}`} className={`flex h-11 items-center rounded-xl px-4 text-sm font-semibold ${vista === v ? "bg-tinta text-white" : "border-[1.5px] border-borde-campo bg-white text-tinta"}`}>{t}</Link>
  );

  return (
    <>
      <Encabezado titulo="Correos del sistema" subtitulo="Qué correos salen, a quién le llegan y cuándo" />
      <main className="flex flex-col gap-5 px-5 pb-10 pt-6 lg:px-8">
        <div className="flex gap-2">{pestana("catalogo", "Catálogo")}{pestana("historial", "Historial de envíos")}</div>

        {vista === "catalogo" ? (
          GRUPOS.map((g) => (
            <section key={g} className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-extrabold">{g}</h2>
              {CATALOGO_CORREOS.filter((c) => c.grupo === g).map((c) => {
                const v = c.vista();
                return (
                  <details key={c.id} className={`${tarjeta} group p-4`}>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                      <span className="text-[16px] font-bold">{v.asunto}</span>
                      <span className="rounded-full bg-[#F1EDE3] px-3 py-1 text-xs font-semibold">Le llega a: {c.destinatario}</span>
                    </summary>
                    <div className="mt-3 flex flex-col gap-3 text-[15px]">
                      <p><b>Cuándo sale:</b> {c.cuando}</p>
                      {c.nota && <p className="rounded-xl bg-[#FFF6DB] p-3 text-sm"><b>Ojo:</b> {c.nota}</p>}
                      <p className="text-xs text-gris">Código: <code>{c.codigo}</code> · {v.html ? "Con diseño" : "Solo texto, sin diseño"}</p>
                      {v.html ? (
                        <iframe title={`Vista previa: ${v.asunto}`} srcDoc={v.html} sandbox="" className="h-[520px] w-full rounded-xl border border-[#EAE3D5] bg-white" />
                      ) : (
                        <pre className="whitespace-pre-wrap rounded-xl border border-[#EAE3D5] bg-[#FBF9F4] p-4 text-sm">{v.texto}</pre>
                      )}
                    </div>
                  </details>
                );
              })}
            </section>
          ))
        ) : (
          <>
            <p className="text-sm text-gris">
              Últimos 7 días: {resumen.enviado ?? 0} enviados · {resumen.error ?? 0} con error · {resumen.simulado ?? 0} simulados. No se guarda el contenido de los correos, solo para quién, asunto y resultado.
            </p>
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="vista" value="historial" />
              <label className="flex flex-col gap-1 text-sm font-semibold">Resultado
                <select name="estado" defaultValue={sp.estado ?? ""} className={campoAdmin}>
                  <option value="">Todos</option>
                  {Object.entries(ESTADO).map(([k, v]) => <option key={k} value={k}>{v.texto}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">Correo o asunto<input type="search" name="q" defaultValue={sp.q ?? ""} className={campoAdmin} /></label>
              <button type="submit" className={botonOscuro}>Filtrar</button>
              <Link href="/admin/correos?vista=historial" className="flex min-h-11 items-center px-2 text-sm font-semibold text-verde underline">Limpiar</Link>
            </form>
            <ul className="flex flex-col gap-3">
              {filas.length === 0 && <li className={`${tarjeta} p-5 text-[15px] text-gris`}>No hay envíos con estos filtros. El historial empieza desde que se activó esta sección.</li>}
              {filas.map((f) => {
                const e = ESTADO[f.estado] ?? { texto: f.estado, clase: "bg-[#F1EDE3] text-gris" };
                const tipo = entradaPorAsunto(f.asunto);
                return (
                  <li key={f.id} className={`${tarjeta} flex flex-col gap-1.5 p-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[16px] font-bold">{f.asunto}</span>
                      <span className="text-xs text-gris">{hora(f.creadoEn)}</span>
                    </div>
                    <p className="text-[15px]">Para: <b>{f.para}</b>{tipo ? ` · ${tipo.grupo}` : ""}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2.5 py-1 font-semibold ${e.clase}`}>{e.texto}</span>{f.error && <span className="text-ladrillo">{f.error}</span>}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
