import { Aviso } from "@/components/cuenta";
import { exigirProveedor, resenasDelProveedor } from "@/lib/panel";
import { responderResena } from "../actions";

/** P8 · Reseñas recibidas y respuesta única (CU-45). Mockup: docs/mockups/Panel_proveedor.md. */
const fecha = (d: Date) => new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" });

export default async function ResenasPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  const lista = await resenasDelProveedor(proveedor.id);

  return (
    <div className="flex flex-col gap-4">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">Puedes responder cada reseña una sola vez, y la respuesta no se puede editar. Responde con respeto: la ven todos.</p>

      {lista.length === 0 && <p className="rounded-[22px] border border-borde-suave bg-white p-5 text-[15px] text-tinta-2">Todavía no tienes reseñas. Se publican cuando un cliente que te escribió desde LasTresB te califica.</p>}

      {lista.map((r) => {
        const prom = Math.round((r.puntualidad + r.calidad + r.calidadPrecio + r.cumplimiento) / 4);
        return (
          <article key={r.id} className="flex flex-col gap-2 rounded-[22px] border border-borde-suave bg-white p-5">
            <span className="flex justify-between gap-2 text-[15px]"><b>{r.cliente}</b><span className="text-gris">{fecha(r.fecha)}</span></span>
            <span role="img" aria-label={`${prom} de 5 estrellas`} className="text-sm tracking-[1px] text-amarillo-oscuro">{"★".repeat(prom)}{"☆".repeat(5 - prom)}</span>
            {r.comentario && <p className="text-[15px] leading-normal text-tinta-2">{r.comentario}</p>}
            <dl className="grid grid-cols-2 gap-x-4 text-[13px] text-gris sm:grid-cols-4">
              <div>Puntualidad <b className="text-tinta">{r.puntualidad}</b></div><div>Calidad <b className="text-tinta">{r.calidad}</b></div><div>Calidad-precio <b className="text-tinta">{r.calidadPrecio}</b></div><div>Cumplimiento <b className="text-tinta">{r.cumplimiento}</b></div>
            </dl>
            {r.respuesta ? (
              <p className="rounded-xl bg-piedra p-3 text-[15px] leading-normal"><b>Tu respuesta:</b> {r.respuesta}</p>
            ) : (
              <form action={responderResena} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={r.id} />
                <label htmlFor={`r-${r.id}`} className="text-sm font-semibold">Tu respuesta</label>
                <textarea id={`r-${r.id}`} name="texto" rows={2} maxLength={500} required className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
                <button type="submit" className="h-11 self-start rounded-xl bg-tinta px-5 text-sm font-semibold text-white">Publicar respuesta</button>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}
