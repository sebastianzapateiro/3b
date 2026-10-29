import Link from "next/link";
import { Aviso, botonOscuro, Chip, Encabezado, Iniciales, tarjeta } from "@/components/admin/Ui";
import { COLAS, contarColas, etiquetaSegmento, listarCola, type Cola } from "@/lib/admin";

/** B1 · Cola de aprobación (CU-50). Mockup: docs/mockups/BO_Aprobaciones.dc.html. */
const TABS: Record<Cola, string> = {
  pendientes: "Pendientes",
  reputacion: "En revisión por reputación",
  rut: "RUT por vencer",
  insignias: "Insignias por renovar",
};

type Params = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Aprobaciones({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const cola = COLAS.find((c) => c === uno(sp.cola)) ?? "pendientes";
  const q = uno(sp.q);
  const segmento = uno(sp.segmento);
  const menores = uno(sp.menores) === "1";
  const riesgo = uno(sp.riesgo) === "1";

  const [conteos, filas] = await Promise.all([contarColas(), listarCola(cola, { q, segmento, menores, riesgo })]);
  const tab = (c: Cola) => `/admin/aprobaciones?cola=${c}`;

  return (
    <>
      <Encabezado titulo="Aprobaciones" subtitulo="Proveedores por revisar, del más antiguo al más reciente">
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex h-11 min-w-0 flex-[0_1_360px] items-center gap-2 rounded-xl border-[1.5px] border-borde-campo bg-white px-3">
            <input type="hidden" name="cola" value={cola} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6663" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input name="q" type="search" defaultValue={q} aria-label="Buscar proveedor" placeholder="Nombre, teléfono o slug" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
          </form>
          <Link href="/admin/proveedores/nuevo" className={botonOscuro}>+ Registrar proveedor</Link>
        </div>
      </Encabezado>

      <main className="flex flex-col gap-4 px-5 pb-10 pt-6 lg:px-8">
        <Aviso ok={uno(sp.ok)} error={uno(sp.error)} />

        <nav aria-label="Colas" className="flex flex-wrap gap-2">
          {COLAS.map((c) => (
            <Link
              key={c}
              href={tab(c)}
              aria-current={c === cola ? "page" : undefined}
              className={`flex h-10 items-center rounded-full px-4 text-sm ${c === cola ? "bg-tinta font-semibold text-white" : "border-[1.5px] border-borde-campo bg-white font-medium"}`}
            >
              {TABS[c]} · {conteos[c]}
            </Link>
          ))}
        </nav>

        <form className="flex flex-wrap items-center gap-2.5 text-sm">
          <input type="hidden" name="cola" value={cola} />
          {q && <input type="hidden" name="q" value={q} />}
          <label htmlFor="segmento" className="text-gris">Segmento</label>
          <select id="segmento" name="segmento" defaultValue={segmento ?? ""} className="h-10 rounded-[10px] border-[1.5px] border-borde-campo bg-white px-2.5">
            <option value="">Todos</option>
            <option value="independiente_sin_rut">Independiente sin RUT</option>
            <option value="independiente_con_rut">Independiente con RUT</option>
            <option value="empresa">Empresa</option>
          </select>
          <label className="ml-2 flex items-center gap-2"><input type="checkbox" name="menores" value="1" defaultChecked={menores} className="size-[18px] accent-verde" />Solo Ley 1918 (menores)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="riesgo" value="1" defaultChecked={riesgo} className="size-[18px] accent-verde" />Solo categorías de riesgo alto</label>
          <button type="submit" className="h-10 rounded-[10px] border-[1.5px] border-borde-campo bg-white px-3 font-semibold">Filtrar</button>
        </form>

        <div className={`${tarjeta} overflow-x-auto`}>
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-crema text-left text-gris">
                <th className="px-[18px] py-3 font-semibold">Proveedor</th>
                <th className="px-3 py-3 font-semibold">Segmento</th>
                <th className="px-3 py-3 font-semibold">Categorías</th>
                <th className="px-3 py-3 font-semibold">Requisitos</th>
                <th className="px-3 py-3 font-semibold">Espera</th>
                <th className="px-[18px] py-3"><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr><td colSpan={6} className="border-t border-borde-suave px-[18px] py-8 text-center text-gris">No hay proveedores en esta cola.</td></tr>
              ) : filas.map((f) => (
                <tr key={f.id} className="border-t border-borde-suave">
                  <td className="px-[18px] py-3.5">
                    <span className="flex items-center gap-2.5">
                      <Iniciales nombre={f.nombre} />
                      <span className="flex flex-col"><b>{f.nombre}</b><span className="text-[13px] text-gris">{f.localidades.join(", ") || "Sin localidades"}</span></span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5">{etiquetaSegmento(f.segmento)}</td>
                  <td className="px-3 py-3.5">{f.categorias.join(", ") || "—"}</td>
                  <td className="px-3 py-3.5">
                    <span className="flex flex-wrap gap-1">
                      {f.requisitos.map((r) => <Chip key={r.texto} tono={r.ok ? "verde" : "rojo"}>{r.ok ? r.texto : `Falta ${r.texto.toLowerCase()}`}</Chip>)}
                    </span>
                  </td>
                  <td className={`px-3 py-3.5 tabular-nums ${f.esperaCritica ? "font-bold text-ladrillo-oscuro" : ""}`}>{f.espera}</td>
                  <td className="px-[18px] py-3.5 text-right"><Link href={`/admin/proveedores/${f.id}`} className="inline-flex h-10 items-center rounded-[10px] bg-tinta px-4 font-semibold text-white">Revisar</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
