import Link from "next/link";
import { Encabezado, tarjeta } from "@/components/admin/Ui";
import { datosTablero, type RangoTablero } from "@/lib/admin";
import { totalReportesPendientes } from "@/lib/moderacion";

/** B7 · Tablero. Mockup: docs/mockups/BO_Tablero.dc.html. */
const RANGOS: Record<RangoTablero, string> = { "7": "Últimos 7 días", "30": "Últimos 30 días", mes: "Este mes" };

const ESTADOS: { clave: string[]; texto: string; color: string }[] = [
  { clave: ["aprobado"], texto: "Aprobado", color: "bg-verde" },
  { clave: ["pendiente"], texto: "Pendiente", color: "bg-amarillo" },
  { clave: ["en_revision"], texto: "En revisión", color: "bg-ladrillo-claro" },
  { clave: ["pausado", "pausado_por_rut"], texto: "Pausado / pausado por RUT", color: "bg-[#9AA3A0]" },
  { clave: ["suspendido"], texto: "Suspendido", color: "bg-tinta" },
  { clave: ["borrador", "rechazado"], texto: "Borrador / rechazado", color: "border-2 border-[#9AA3A0]" },
];

const numero = "font-display text-[40px] leading-none tabular-nums";

export default async function Tablero({ searchParams }: { searchParams: Promise<{ rango?: string }> }) {
  const { rango: r } = await searchParams;
  const rango: RangoTablero = r === "30" || r === "mes" ? r : "7";
  const d = await datosTablero(rango);
  const reportes = await totalReportesPendientes().catch(() => 0);
  const maxCat = Math.max(1, ...d.porCategoria.map((c) => c.n));

  return (
    <>
      <Encabezado titulo="Tablero" subtitulo="Lo que necesita atención hoy y cómo va la plataforma">
        <form className="flex gap-2.5">
          <label htmlFor="rango" className="sr-only">Periodo</label>
          <select id="rango" name="rango" defaultValue={rango} className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-sm font-semibold">
            {Object.entries(RANGOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <button type="submit" className="h-11 rounded-xl border-2 border-tinta px-4 text-sm font-semibold">Ver</button>
        </form>
      </Encabezado>

      <main className="flex flex-col gap-6 px-5 pb-10 pt-6 lg:px-8">
        <section aria-label="Pendientes" className="flex flex-wrap gap-3.5">
          <Link href="/admin/aprobaciones" className={`${tarjeta} flex flex-[1_1_220px] flex-col gap-1.5 rounded-[18px] p-[18px]`}>
            <span className="text-sm font-semibold text-gris">Proveedores por aprobar</span>
            <b className={numero}>{d.pendientes}</b>
            <span className="text-[13px] text-amarillo-oscuro">{d.pendientes > 0 ? `El más antiguo espera ${d.diasMasAntiguo} días` : "Todo al día"}</span>
          </Link>
          <Link href="/admin/moderacion" className={`${tarjeta} flex flex-[1_1_220px] flex-col gap-1.5 rounded-[18px] p-[18px]`}>
            <span className="text-sm font-semibold text-gris">Reportes por moderar</span>
            <b className={numero}>{reportes}</b>
            <span className="text-[13px] text-gris">Meta: atender en 48 h</span>
          </Link>
          <div className={`${tarjeta} flex flex-[1_1_220px] flex-col gap-1.5 rounded-[18px] border-[#F0C9BE] p-[18px]`}>
            <span className="text-sm font-semibold text-gris">Reclamos y solicitudes abiertos</span>
            <b className={numero}>{d.reclamosAbiertos}</b>
            <span className="text-[13px] font-semibold text-ladrillo-oscuro">{d.reclamosPronto} vencen en menos de 2 días</span>
          </div>
          <div className={`${tarjeta} flex flex-[1_1_220px] flex-col gap-1.5 rounded-[18px] p-[18px]`}>
            <span className="text-sm font-semibold text-gris">Contactos a WhatsApp</span>
            <b className={`${numero} text-verde`}>{d.contactos}</b>
            <span className="text-[13px] text-gris">{d.porcentajeResena} % terminaron en reseña</span>
          </div>
        </section>

        <section className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Demanda sin cubrir</h2>
            <span className="text-[13px] text-gris">Personas que pidieron un servicio sin proveedores suficientes</span>
          </div>
          {d.demanda.length === 0 ? (
            <p className="text-[15px] text-gris">Aún no hay solicitudes en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm tabular-nums">
                <thead><tr className="text-left text-gris"><th className="py-2 font-semibold">Servicio</th><th className="py-2 font-semibold">Localidad</th><th className="py-2 text-right font-semibold">Solicitudes</th><th className="py-2 text-right font-semibold">Con WhatsApp</th></tr></thead>
                <tbody>
                  {d.demanda.map((x, i) => (
                    <tr key={i} className="border-t border-borde-suave"><td className="py-2.5">{x.oficio}</td><td>{x.localidad ?? "Cualquiera"}</td><td className="text-right">{x.n}</td><td className="text-right">{x.conWhatsapp}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-start gap-5">
          <section className={`${tarjeta} flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-[22px]`}>
            <h2 className="font-display text-xl font-bold">Contactos por categoría</h2>
            {d.porCategoria.length === 0 ? (
              <p className="text-[15px] text-gris">Aún no hay contactos en este periodo.</p>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                {d.porCategoria.map((c) => (
                  <div key={c.nombre} className="grid grid-cols-[110px_minmax(0,1fr)_48px] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)_56px]">
                    <span>{c.nombre}</span>
                    <span className="h-3.5 rounded-[7px] bg-[#EFE8DA]"><span className="block h-3.5 rounded-[7px] bg-verde" style={{ width: `${(c.n / maxCat) * 100}%` }} /></span>
                    <span className="text-right tabular-nums">{c.n}</span>
                  </div>
                ))}
              </div>
            )}
            <h3 className="mt-2 text-[15px] font-semibold">Localidades con más contactos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="text-left text-gris">
                    <th className="py-2 font-semibold">Localidad</th>
                    <th className="py-2 text-right font-semibold">Contactos</th>
                    <th className="py-2 text-right font-semibold">Proveedores activos</th>
                    <th className="py-2 text-right font-semibold">Contactos por proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {d.porLocalidad.length === 0 ? (
                    <tr><td colSpan={4} className="border-t border-borde-suave py-3 text-gris">Sin datos en este periodo.</td></tr>
                  ) : d.porLocalidad.map((l) => (
                    <tr key={l.nombre} className="border-t border-borde-suave">
                      <td className="py-2.5">{l.nombre}</td>
                      <td className="text-right">{l.contactos}</td>
                      <td className="text-right">{l.activos}</td>
                      <td className="text-right">{l.activos ? (l.contactos / l.activos).toFixed(1).replace(".", ",") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <section className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">Proveedores por estado</h2>
              <ul className="flex flex-col gap-2 text-sm tabular-nums">
                {ESTADOS.map((e) => (
                  <li key={e.texto} className="flex justify-between">
                    <span className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${e.color}`} />{e.texto}</span>
                    <b>{e.clave.map((c) => d.estados[c] ?? 0).join(" / ")}</b>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">Alertas</h2>
              {d.alertas.reclamosPronto > 0 && (
                <div className="flex gap-2.5 rounded-xl bg-[#F9E1DB] p-3 text-sm leading-[1.4] text-ladrillo-oscuro"><b>Plazo</b>{d.alertas.reclamosPronto} reclamos o solicitudes vencen en menos de 2 días</div>
              )}
              {d.alertas.menoresPorVencer > 0 && (
                <div className="flex gap-2.5 rounded-xl bg-amarillo-suave p-3 text-sm leading-[1.4] text-amarillo-oscuro"><b>Insignia</b>{d.alertas.menoresPorVencer} insignias «Apto para menores» vencen en 15 días</div>
              )}
              {d.alertas.rutPorVencer > 0 && (
                <div className="flex gap-2.5 rounded-xl bg-amarillo-suave p-3 text-sm leading-[1.4] text-amarillo-oscuro"><b>RUT</b>{d.alertas.rutPorVencer} independientes sin RUT a menos de 5 días de pausa</div>
              )}
              {d.alertas.documentosEnUnaHora > 30 && (
                <div className="flex gap-2.5 rounded-xl bg-piedra p-3 text-sm leading-[1.4] text-tinta-2"><b>Auditoría</b>Un verificador abrió más de 30 documentos en una hora</div>
              )}
              {d.alertas.reclamosPronto + d.alertas.menoresPorVencer + d.alertas.rutPorVencer === 0 && d.alertas.documentosEnUnaHora <= 30 && (
                <p className="text-[15px] text-gris">Sin alertas por ahora.</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
