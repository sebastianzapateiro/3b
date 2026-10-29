import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { MOTIVOS_REPORTE } from "@/lib/reportes";
import { reportarContenido } from "./actions";

export const metadata = { title: "Reportar contenido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const campo = "h-12 w-full rounded-xl border-[1.5px] border-borde-campo bg-white px-3 text-base";

/** Reporte de una reseña o un perfil (CU-23 / CU-60). Lo revisa el equipo de moderación (B3). */
export default async function Reportar({ searchParams }: { searchParams: Promise<{ tipo?: string; id?: string; enviado?: string; error?: string }> }) {
  const sp = await searchParams;
  const tipo = sp.tipo === "resena" ? "resena" : "perfil";
  let titulo = "Reportar contenido";
  let detalle = "";
  let volver = "/";

  if (sp.id) {
    if (tipo === "resena") {
      const [r] = await db.select({ c: schema.resenas.comentario, slug: schema.proveedores.slug, p: schema.proveedores.nombrePublico }).from(schema.resenas).innerJoin(schema.proveedores, eq(schema.proveedores.id, schema.resenas.proveedorId)).where(eq(schema.resenas.id, sp.id)).limit(1).catch(() => []);
      if (r) { titulo = `Reportar una reseña de ${r.p}`; detalle = r.c ? `«${r.c.slice(0, 160)}»` : "Reseña sin comentario"; volver = `/${r.slug}#resenas`; }
    } else {
      const [p] = await db.select({ n: schema.proveedores.nombrePublico, slug: schema.proveedores.slug }).from(schema.proveedores).where(eq(schema.proveedores.slug, sp.id)).limit(1).catch(() => []);
      if (p) { titulo = `Reportar el perfil de ${p.n}`; volver = `/${p.slug}`; }
    }
  }

  return (
    <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-5 pb-14 pt-4 sm:pt-10">
      <Link href={volver} className="inline-flex h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-tinta-2">‹ Volver</Link>
      <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-4xl">{titulo}</h1>
      {detalle && <p className="rounded-xl bg-piedra p-3.5 text-[15px] leading-normal text-tinta-2">{detalle}</p>}
      <p className="text-base leading-normal text-tinta-2">Cuéntanos qué pasa. El equipo revisa cada reporte. Una reseña no se oculta por ser negativa: solo si incumple la <Link href="/resenas" className="font-semibold text-verde underline">política de reseñas</Link>.</p>

      {sp.enviado ? (
        <p role="status" className="rounded-[18px] bg-verde-claro p-4 text-[15px] text-verde-oscuro"><b>Gracias.</b> Recibimos tu reporte y lo revisaremos.</p>
      ) : !sp.id ? (
        <p role="alert" className="rounded-[18px] bg-ladrillo-suave p-4 text-[15px] text-ladrillo-oscuro">No encontramos qué quieres reportar. Entra desde el botón «Reportar» de un perfil o una reseña.</p>
      ) : (
        <form action={reportarContenido} className="flex flex-col gap-3.5 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
          {sp.error && <p role="alert" className="rounded-xl bg-ladrillo-suave p-3 text-[15px] text-ladrillo-oscuro">{sp.error}</p>}
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="id" value={sp.id} />
          <div className="flex flex-col gap-1.5"><label htmlFor="motivo" className="text-sm font-semibold">Motivo</label><select id="motivo" name="motivo" className={campo}>{MOTIVOS_REPORTE.map((m) => <option key={m}>{m}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="detalle" className="text-sm font-semibold">Detalle <span className="font-normal text-gris">(opcional)</span></label><textarea id="detalle" name="detalle" rows={3} maxLength={500} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" /></div>
          <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor="web">No llenar</label><input id="web" name="web" tabIndex={-1} autoComplete="off" /></div>
          <button type="submit" className="h-[54px] self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Enviar reporte</button>
        </form>
      )}
    </main>
  );
}
