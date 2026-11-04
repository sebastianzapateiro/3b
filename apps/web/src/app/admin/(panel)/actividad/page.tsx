import Link from "next/link";
import { ETIQUETA_EVENTO } from "@/lib/actividad-cola";
import { listarActividad } from "@/lib/actividad";
import { marcarActividadVista } from "@/app/admin/(panel)/actividad/actions";
import { Aviso, botonOscuro, campoAdmin, Encabezado, tarjeta } from "@/components/admin/Ui";
import { listarCatalogo } from "@/lib/admin";
import { exigirBackoffice } from "@/lib/verificacion";

/** B1 · Actividad reciente de proveedores: lo mismo que llega por correo, para verlo dentro de LasTresB. Solo Admin (2FA). */
export const metadata = { title: "Actividad reciente" };

const hora = (d: Date) => d.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });

export default async function Actividad({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirBackoffice(true);
  const sp = await searchParams;
  const [{ filas, sinVer }, padres] = await Promise.all([
    listarActividad({ tipo: sp.tipo || undefined, oficio: sp.oficio || undefined, desde: sp.desde || undefined, hasta: sp.hasta || undefined, soloSinVer: sp.sinver === "1" }),
    listarCatalogo(),
  ]);
  const oficios = padres.flatMap((p) => p.hijas.map((h) => ({ id: h.id, nombre: h.nombre })));

  return (
    <>
      <Encabezado titulo="Actividad reciente" subtitulo="Cada movimiento de un proveedor: creación, datos guardados, archivos y cambios de estado">
        <form action={marcarActividadVista}>
          <button type="submit" className={botonOscuro} disabled={sinVer === 0}>Marcar todo como visto{sinVer > 0 ? ` (${sinVer})` : ""}</button>
        </form>
      </Encabezado>
      <main className="flex flex-col gap-5 px-5 pb-10 pt-6 lg:px-8">
        <Aviso ok={sp.ok} />
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">Tipo
            <select name="tipo" defaultValue={sp.tipo ?? ""} className={campoAdmin}>
              <option value="">Todos</option>
              {Object.entries(ETIQUETA_EVENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Oficio
            <select name="oficio" defaultValue={sp.oficio ?? ""} className={campoAdmin}>
              <option value="">Todos</option>
              {oficios.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Desde<input type="date" name="desde" defaultValue={sp.desde ?? ""} className={campoAdmin} /></label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Hasta<input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className={campoAdmin} /></label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="sinver" value="1" defaultChecked={sp.sinver === "1"} className="size-5 accent-verde" />Solo sin ver</label>
          <button type="submit" className={botonOscuro}>Filtrar</button>
          <Link href="/admin/actividad" className="flex min-h-11 items-center px-2 text-sm font-semibold text-verde underline">Limpiar</Link>
        </form>

        <p className="text-sm text-gris">{sinVer} sin ver · mostrando {filas.length}</p>
        <ul className="flex flex-col gap-3">
          {filas.length === 0 && <li className={`${tarjeta} p-5 text-[15px] text-gris`}>No hay movimientos con estos filtros.</li>}
          {filas.map((f) => (
            <li key={f.id} className={`${tarjeta} flex flex-col gap-1.5 p-4 ${f.vistoEn ? "" : "border-l-4 border-l-verde"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/proveedores/${f.proveedorId}`} className="text-[16px] font-bold text-verde underline">{f.nombre}</Link>
                <span className="text-xs text-gris">{hora(f.creadoEn)}</span>
              </div>
              <p className="text-[15px]"><b>{ETIQUETA_EVENTO[f.tipo as keyof typeof ETIQUETA_EVENTO] ?? f.tipo}</b>{f.detalle ? ` · ${f.detalle}` : ""}{f.campos.length > 0 ? ` · ${f.campos.join(", ")}` : ""}</p>
              <p className="text-xs text-gris">
                Fuente: {[f.s, f.m, f.c].filter(Boolean).join(" / ") || "sin registrar"}{f.t ? ` · ID de seguimiento ${f.t}` : ""}
                {f.error ? ` · Correo con error: ${f.error}` : f.enviadoEn ? "" : " · correo pendiente"}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
