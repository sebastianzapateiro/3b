import { Aviso } from "@/components/cuenta";
import { exigirProveedor } from "@/lib/panel";
import { contactosDelProveedor } from "@/lib/servicios-prestados";
import { marcarPrestado } from "../actions";

/** P8 · Contactos recibidos y «Servicio prestado» (CU-38): al marcarlo, LasTresB le pide al cliente que califique. */
const fecha = (d: Date) => new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" });

const ESTADO = { contactado: "Te contactó", prestado: "Servicio prestado · calificación pedida", calificado: "Ya te calificó" } as const;

export default async function ContactosPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor } = await exigirProveedor();
  const sp = await searchParams;
  const lista = await contactosDelProveedor(proveedor.id);

  return (
    <div className="flex flex-col gap-4">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="text-[15px] leading-normal text-tinta-2">Cuando termines un trabajo, pulsa «Servicio prestado»: le pedimos al cliente que califique y su reseña queda verificada. Úsalo solo si de verdad prestaste el servicio.</p>

      {lista.length === 0 && <p className="rounded-[22px] border border-borde-suave bg-white p-5 text-[15px] text-tinta-2">Todavía nadie te ha contactado desde LasTresB. Aquí verás a quien te escriba por WhatsApp desde tu perfil o la búsqueda.</p>}

      {lista.map((c) => (
        <article key={c.id} className="flex flex-col gap-2 rounded-[22px] border border-borde-suave bg-white p-5">
          <span className="flex flex-wrap justify-between gap-2 text-[15px]"><b>{c.cliente ?? "Cliente de LasTresB"}</b><span className="text-gris">{fecha(c.cuando)}</span></span>
          {(c.categoria || c.solicitud) && <p className="text-[15px] leading-normal text-tinta-2">{c.categoria}{c.categoria && c.solicitud ? " · " : ""}{c.solicitud && `«${c.solicitud}»`}</p>}
          <span className="text-sm text-gris">{ESTADO[c.estado]}</span>
          {c.estado === "contactado" && (
            <form action={marcarPrestado}>
              <input type="hidden" name="contactoId" value={c.id} />
              <button type="submit" className="h-11 rounded-xl bg-verde px-5 text-sm font-semibold text-white hover:bg-verde-oscuro">Servicio prestado</button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
