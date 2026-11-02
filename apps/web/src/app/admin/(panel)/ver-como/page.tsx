import { like, or, sql } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { botonBorde, Chip, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { exigirBackoffice } from "@/lib/verificacion";
import { verComoProveedor } from "./actions";

/** B1 · Visuales del administrador: panel de un proveedor (solo lectura) y vista de cliente con sesión. Solo administradores. */
const ESTADO: Record<string, string> = { borrador: "Borrador", pendiente: "Pendiente", aprobado: "Aprobado", en_revision: "En revisión", rechazado: "Rechazado", pausado: "Pausado", pausado_por_rut: "Pausado por RUT", suspendido: "Suspendido" };

export default async function VerComo({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  await exigirBackoffice(true);
  const { q, error } = await searchParams;
  const texto = q?.trim();
  const { proveedores } = schema;
  const filas = await db
    .select({ id: proveedores.id, nombre: proveedores.nombrePublico, slug: proveedores.slug, estado: proveedores.estado })
    .from(proveedores)
    .where(texto ? or(like(sql`lower(${proveedores.nombrePublico})`, `%${texto.toLowerCase()}%`), like(proveedores.slug, `%${texto.toLowerCase()}%`)) : undefined)
    .orderBy(proveedores.nombrePublico)
    .limit(30);

  return (
    <>
      <Encabezado titulo="Ver como" subtitulo="Mira la plataforma como la ven los proveedores y los clientes con sesión. Solo administradores." />
      <main className="flex flex-col gap-5 px-5 pb-10 pt-6 lg:px-8">
        {error && <p role="alert" className="rounded-[14px] bg-ladrillo-suave px-4 py-3 text-sm font-semibold text-ladrillo-oscuro">{error}</p>}
        <section className={`${tarjeta} flex flex-col gap-2 p-[18px]`}>
          <h2 className="font-display text-xl font-bold">Visual de cliente</h2>
          <p className="text-[15px] text-tinta-2">Con tu sesión iniciada ves lo mismo que un cliente: el sitio público con su menú y «Mi cuenta». Es tu propia cuenta, no la de un cliente real.</p>
          <span className="flex flex-wrap gap-2.5">
            <a href="/" target="_blank" rel="noopener noreferrer" className={botonBorde}>Abrir el sitio</a>
            <a href="/cuenta" target="_blank" rel="noopener noreferrer" className={botonBorde}>Abrir Mi cuenta</a>
          </span>
        </section>

        <section className={`${tarjeta} flex flex-col gap-3 p-[18px]`}>
          <h2 className="font-display text-xl font-bold">Visual de proveedor</h2>
          <p className="text-[15px] text-tinta-2">Elige un proveedor y verás su panel tal cual lo ve él. Es solo lectura: no se puede guardar nada. Cada vez que entras queda en la auditoría con tu nombre.</p>
          <form className="flex flex-wrap gap-2.5">
            <label htmlFor="q" className="sr-only">Buscar proveedor</label>
            <input id="q" name="q" type="search" defaultValue={texto} placeholder="Nombre o enlace del proveedor" className={`${campoAdmin} flex-[1_1_240px]`} />
            <button type="submit" className="h-11 rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Buscar</button>
          </form>
          {filas.length === 0 && <p className="text-[15px] text-gris">No hay proveedores con esa búsqueda.</p>}
          {filas.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-piedra p-3.5">
              <span className="flex flex-col text-[15px]"><b>{p.nombre}</b><span className="font-mono text-[13px] text-gris">{p.slug}</span></span>
              <span className="flex items-center gap-2.5">
                <Chip tono={p.estado === "aprobado" ? "verde" : "gris"}>{ESTADO[p.estado] ?? p.estado}</Chip>
                <form action={verComoProveedor}><input type="hidden" name="id" value={p.id} /><button type="submit" className={botonBorde}>Ver su panel</button></form>
              </span>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
