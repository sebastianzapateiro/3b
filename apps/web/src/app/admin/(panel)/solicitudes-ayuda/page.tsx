import { notFound } from "next/navigation";
import { botonBorde, Chip, Encabezado, tarjeta } from "@/components/admin/Ui";
import { conteosAyuda, listarSolicitudesAyuda } from "@/lib/solicitudes-ayuda";
import { exigirBackoffice } from "@/lib/verificacion";
import { marcarContactada } from "./actions";

/** B7 · Solicitudes de ayuda para inscripción (botón flotante, /ingreso y menú del celular). Solo administradores: el celular es dato personal. */
export const metadata = { title: "Ayuda para inscripción" };

const ORIGEN: Record<string, string> = { boton_flotante: "Botón flotante", ingreso: "Página de ingreso", menu: "Menú del celular" };
const fecha = (d: Date) => new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });
const dia = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-CO", { dateStyle: "medium" });

export default async function SolicitudesAyuda() {
  const { roles } = await exigirBackoffice();
  if (!roles.includes("admin")) notFound();
  const [filas, conteos] = await Promise.all([listarSolicitudesAyuda(), conteosAyuda()]);

  return (
    <>
      <Encabezado titulo="Solicitudes de ayuda para inscripción" subtitulo="Proveedores que pidieron que los llamen para ayudarles a inscribirse. Solo tú lo ves." />
      <div className="flex flex-col gap-5 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${tarjeta} p-4`}>
            <p className="text-sm text-tinta-2">Sin contactar</p>
            <b className="font-display text-3xl">{conteos.nuevas}</b>
          </div>
          <div className={`${tarjeta} p-4`}>
            <p className="text-sm font-semibold">Por origen</p>
            <ul className="mt-1.5 flex flex-col gap-0.5 text-sm">
              {conteos.porOrigen.length === 0 && <li className="text-gris">Aún no hay solicitudes.</li>}
              {conteos.porOrigen.map((o) => <li key={o.origen} className="flex justify-between"><span>{ORIGEN[o.origen] ?? o.origen}</span><b>{o.total}</b></li>)}
            </ul>
          </div>
          <div className={`${tarjeta} p-4`}>
            <p className="text-sm font-semibold">Por día (últimos 14)</p>
            <ul className="mt-1.5 flex flex-col gap-0.5 text-sm">
              {conteos.porDia.length === 0 && <li className="text-gris">Sin solicitudes recientes.</li>}
              {conteos.porDia.map((d) => <li key={d.dia} className="flex justify-between"><span>{dia(d.dia)}</span><b>{d.total}</b></li>)}
            </ul>
          </div>
        </div>

        <div className={`${tarjeta} overflow-x-auto`}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-borde-suave text-tinta-2">
              <tr>
                <th className="px-3 py-3 font-semibold">Fecha</th>
                <th className="px-3 py-3 font-semibold">Nombre</th>
                <th className="px-3 py-3 font-semibold">Oficio</th>
                <th className="px-3 py-3 font-semibold">Celular</th>
                <th className="px-3 py-3 font-semibold">Origen</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-3 py-3 font-semibold"><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gris">Todavía no hay solicitudes.</td></tr>}
              {filas.map((s) => (
                <tr key={s.id} className="border-b border-borde-suave last:border-0 align-top">
                  <td className="px-3 py-2.5 whitespace-nowrap">{fecha(s.creada)}</td>
                  <td className="px-3 py-2.5 font-semibold">{s.nombre}</td>
                  <td className="px-3 py-2.5">
                    {s.oficio}
                    {s.revisar && <span className="ml-2"><Chip tono="rojo">Revisar: servicio no permitido</Chip></span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><a href={`tel:+${s.celular.replace(/\D/g, "")}`} className="font-semibold underline">{s.celular}</a></td>
                  <td className="px-3 py-2.5">{ORIGEN[s.origen] ?? s.origen}{s.pagina && <span className="block text-xs text-gris">{s.pagina}</span>}</td>
                  <td className="px-3 py-2.5"><Chip tono={s.estado === "nueva" ? "amarillo" : "verde"}>{s.estado === "nueva" ? "Nueva" : "Contactada"}</Chip></td>
                  <td className="px-3 py-2.5">
                    {s.estado === "nueva" && (
                      <form action={marcarContactada}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className={botonBorde}>Marcar contactada</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
