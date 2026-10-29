import Link from "next/link";
import { actividadDelUsuario, exigirUsuario } from "@/lib/cuenta";

/** P6 · Contactos y reseñas de la persona. Desde aquí se califica a quien se contactó. Mockup: docs/mockups/Mi_cuenta.md. */
const tarjeta = "flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const fecha = (d: Date) => new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" });

export default async function Actividad() {
  const u = await exigirUsuario("/cuenta/actividad");
  const { contactos, resenas } = await actividadDelUsuario(u.id);

  return (
    <div className="flex flex-col gap-5">
      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">A quién contactaste</h2>
        {contactos.length === 0 ? (
          <p className="text-[15px] text-tinta-2">Aún no has escrito a ningún proveedor. <Link href="/categorias" className="font-semibold text-verde">Explora las categorías</Link>.</p>
        ) : (
          <ul className="flex flex-col">
            {contactos.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-borde-suave py-3 first:border-0">
                <span className="flex flex-col">
                  <Link href={`/${c.slug}`} className="font-bold text-tinta">{c.proveedor}</Link>
                  <span className="text-sm text-gris">{c.servicio ?? "Servicio"} · {fecha(c.fecha)}</span>
                </span>
                {c.resenaId ? (
                  <span className="text-sm font-semibold text-verde-oscuro">Ya la calificaste</span>
                ) : (
                  <Link href={`/${c.slug}/calificar`} className="flex h-11 items-center rounded-xl border-2 border-tinta px-4 text-sm font-semibold text-tinta">Calificar</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Mis reseñas</h2>
        {resenas.length === 0 ? (
          <p className="text-[15px] text-tinta-2">Todavía no has publicado reseñas.</p>
        ) : (
          <ul className="flex flex-col">
            {resenas.map((r) => {
              const prom = Math.round((r.puntualidad + r.calidad + r.calidadPrecio + r.cumplimiento) / 4);
              return (
                <li key={r.id} className="flex flex-col gap-1 border-t border-borde-suave py-3 first:border-0">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/${r.slug}#resenas`} className="font-bold text-tinta">{r.proveedor}</Link>
                    <span className="text-sm text-gris">{fecha(r.fecha)}{r.estado !== "visible" && " · en revisión"}</span>
                  </span>
                  <span role="img" aria-label={`${prom} de 5 estrellas`} className="text-sm tracking-[1px] text-amarillo-oscuro">{"★".repeat(prom)}{"☆".repeat(5 - prom)}</span>
                  {r.comentario && <p className="text-[15px] leading-normal text-tinta-2">{r.comentario}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
