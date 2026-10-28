import type { Metadata } from "next";
import { LOCALIDADES_BOGOTA } from "@las3b/shared";
import { TarjetaProveedor } from "@/components/TarjetaProveedor";
import type { ProveedorResumen } from "@/lib/demo";
import { buscarProveedores } from "@/lib/busqueda";

/** Resultados de búsqueda (P2, CU-01). Mockup: docs/mockups/Resultados_web.dc.html y Resultados_movil.dc.html. */
export const metadata: Metadata = { title: "Resultados de búsqueda · Las 3B" };

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; localidad?: string; categoria?: string }>;
}) {
  const { q, localidad, categoria } = await searchParams;
  const resultados = await buscarProveedores({ q, localidad, categoria });

  const tarjetas: ProveedorResumen[] = resultados.map((r) => ({
    slug: r.slug,
    nombre: r.nombre,
    iniciales: r.nombre
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    servicio: r.servicio,
    localidades: r.localidades,
    promedio: r.promedio,
    totalResenas: r.totalResenas,
    insignias: [],
    precioDesde: undefined,
    tono: "verde",
  }));

  const tieneResultados = tarjetas.length > 0;
  const localidadSeleccionada = LOCALIDADES_BOGOTA.find((l) => l.slug === localidad)?.nombre;

  return (
    <section className="mx-auto flex max-w-[1200px] flex-col gap-3.5 px-5 pb-7 pt-2 sm:gap-5 sm:px-6 sm:pb-14 sm:pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[22px] font-bold sm:text-[32px] sm:tracking-[-0.8px]">
          Resultados de búsqueda
        </h2>
        {tieneResultados && (
          <span className="text-sm text-gris">
            {tarjetas.length} resultado{tarjetas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!tieneResultados && (
        <article className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-borde-suave bg-white p-3.5 sm:p-[18px]">
          <p className="text-[15px] leading-normal text-tinta-2">
            No encontramos proveedores disponibles{" "}
            {localidad ? `en ${localidadSeleccionada ?? localidad}` : ""}
            {q ? ` para «${q}»` : ""}.
          </p>
          <p className="text-sm text-gris">
            Intenta otra palabra clave o elige otra localidad.
          </p>
        </article>
      )}

      {tieneResultados && (
        <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-4 [&>*:nth-child(n+4)]:hidden sm:[&>*:nth-child(n+4)]:flex">
          {tarjetas.map((t) => (
            <TarjetaProveedor key={t.slug} proveedor={t} />
          ))}
        </div>
      )}
    </section>
  );
}
