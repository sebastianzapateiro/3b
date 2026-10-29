import { Fragment } from "react";
import Link from "next/link";
import { guardarCategoria } from "@/app/admin/actions";
import { Aviso, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { listarCatalogo, listarLocalidades, obtenerSubcategoria } from "@/lib/admin";
import { exigirBackoffice } from "@/lib/verificacion";

/** B5 · Catálogo: categorías, sinónimos, localidades y barrios (CU-73). Solo administradores. Mockup: docs/mockups/BO_Catalogo.dc.html. */
const si = "font-semibold text-ladrillo-oscuro";

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirBackoffice(true);
  const sp = await searchParams;
  const verLocalidades = sp.tab === "localidades";
  const [padres, localidades] = await Promise.all([listarCatalogo(), verLocalidades ? listarLocalidades() : Promise.resolve([])]);
  const editando = sp.c ? await obtenerSubcategoria(Number(sp.c)) : null;
  const tab = (activo: boolean) => `flex h-[38px] items-center rounded-full px-3.5 text-sm ${activo ? "bg-tinta font-semibold text-white" : "border-[1.5px] border-borde-campo bg-white font-medium"}`;

  return (
    <>
      <Encabezado titulo="Catálogo" subtitulo="Categorías, sinónimos de búsqueda, localidades y barrios">
        <nav aria-label="Catálogo" className="flex gap-1.5">
          <Link href="/admin/catalogo" className={tab(!verLocalidades)}>Categorías</Link>
          <Link href="/admin/catalogo?tab=localidades" className={tab(verLocalidades)}>Localidades y barrios</Link>
        </nav>
      </Encabezado>

      <main className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        {verLocalidades ? (
          <section className={`${tarjeta} min-w-0 flex-[1_1_520px] overflow-x-auto`}>
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-crema text-left text-gris"><th className="px-[18px] py-3 font-semibold">N.º</th><th className="p-3 font-semibold">Localidad</th><th className="p-3 font-semibold">Slug</th><th className="p-3 text-right font-semibold">Barrios</th></tr></thead>
              <tbody>
                {localidades.map((l) => (
                  <tr key={l.id} className="border-t border-borde-suave"><td className="px-[18px] py-3 tabular-nums">{l.numero}</td><td className="p-3">{l.nombre}</td><td className="p-3 font-mono text-[13px]">{l.slug}</td><td className="p-3 text-right tabular-nums">{l.barrios}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <>
            <section className={`${tarjeta} min-w-0 flex-[3_1_520px] overflow-x-auto`}>
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-crema text-left text-gris">
                    <th className="px-[18px] py-3 font-semibold">Categoría</th><th className="p-3 font-semibold">Menores</th><th className="p-3 font-semibold">RUT desde el alta</th><th className="p-3 font-semibold">Matrícula</th><th className="p-3 text-right font-semibold">Proveedores</th>
                  </tr>
                </thead>
                <tbody>
                  {padres.map((p) => (
                    <Fragment key={p.id}>
                      <tr className="border-t border-borde-suave bg-crema"><td colSpan={5} className="px-[18px] py-3 font-bold">{p.nombre} · {p.hijas.length} subcategorías</td></tr>
                      {p.hijas.map((h) => (
                        <tr key={h.id} className={`border-t border-borde-suave ${editando?.id === h.id ? "bg-verde-claro" : ""}`}>
                          <td className="py-3 pl-[34px] pr-3"><Link href={`/admin/catalogo?c=${h.id}`} className={editando?.id === h.id ? "font-bold" : ""}>{h.nombre}{!h.activa && " (inactiva)"}</Link></td>
                          <td className="p-3">{h.exigeInsigniaMenores ? <span className="font-semibold text-amarillo-oscuro">Insignia obligatoria</span> : "—"}</td>
                          <td className="p-3">{h.exigeRutDesdeAlta ? <span className={si}>Sí</span> : "—"}</td>
                          <td className="p-3">{h.exigeMatricula ? <span className={si}>Sí</span> : "—"}</td>
                          <td className="p-3 text-right tabular-nums">{h.proveedores}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="min-w-0 flex-[2_1_340px]">
              {editando ? (
                <form action={guardarCategoria} className="flex flex-col gap-3 rounded-[20px] border-2 border-tinta bg-white p-[22px]">
                  <input type="hidden" name="id" value={editando.id} />
                  <h2 className="font-display text-xl font-bold">Editar subcategoría</h2>
                  <Aviso ok={sp.ok} error={sp.error} />
                  <div className="flex gap-2.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5"><label htmlFor="nombre" className="text-sm font-semibold">Nombre</label><input id="nombre" name="nombre" defaultValue={editando.nombre} required className={campoAdmin} /></div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <label htmlFor="padreId" className="text-sm font-semibold">Dentro de</label>
                      <select id="padreId" name="padreId" defaultValue={editando.padreId ?? ""} className={campoAdmin}>
                        {padres.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <label htmlFor="slug" className="text-sm font-semibold">Slug</label>
                  <input id="slug" name="slug" defaultValue={editando.slug} required className={`${campoAdmin} font-mono`} />
                  <label htmlFor="terminos" className="text-sm font-semibold">Palabras clave y sinónimos (separados por coma)</label>
                  <textarea id="terminos" name="terminos" rows={4} defaultValue={editando.terminos.map((t) => t.termino).join(", ")} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-[15px] leading-[1.45]" />
                  <fieldset className="flex flex-col gap-2.5 text-[15px]">
                    <legend className="mb-2 text-sm font-semibold">Requisitos para aparecer en esta categoría</legend>
                    <label className="flex items-center gap-2.5"><input type="checkbox" name="menores" defaultChecked={editando.exigeInsigniaMenores} className="size-5 accent-verde" />Exige insignia «Apto para menores» (Ley 1918)</label>
                    <label className="flex items-center gap-2.5"><input type="checkbox" name="rut" defaultChecked={editando.exigeRutDesdeAlta} className="size-5 accent-verde" />Exige RUT desde el alta (riesgo alto)</label>
                    <label className="flex items-center gap-2.5"><input type="checkbox" name="matricula" defaultChecked={editando.exigeMatricula} className="size-5 accent-verde" />Exige matrícula o certificación</label>
                    <label className="flex items-center gap-2.5"><input type="checkbox" name="activa" defaultChecked={editando.activa} className="size-5 accent-verde" />Activa</label>
                  </fieldset>
                  {editando.proveedores > 0 && (
                    <p className="rounded-xl bg-amarillo-suave px-3.5 py-3 text-sm leading-[1.45] text-amarillo-oscuro">Esta categoría tiene {editando.proveedores} proveedores: no se puede borrar, solo desactivar.</p>
                  )}
                  <button type="submit" className="h-11 self-end rounded-xl bg-tinta px-5 text-[15px] font-bold text-white">Guardar cambios</button>
                </form>
              ) : (
                <p className={`${tarjeta} p-[22px] text-[15px] text-gris`}>Elige una subcategoría de la tabla para editar su nombre, sinónimos y requisitos.</p>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
