"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CENTROS_LOCALIDADES, type LocalidadSlug } from "@las3b/shared";

/** «Ver los más cercanos»: con permiso del navegador, ubica la localidad más próxima y abre la búsqueda filtrada. */
export function BotonCercanos({ oficio }: { oficio: string }) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");

  function ubicar() {
    if (!navigator.geolocation) return setMensaje("Tu navegador no permite usar la ubicación.");
    setMensaje("Buscando tu localidad…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const cercana = (Object.entries(CENTROS_LOCALIDADES) as [LocalidadSlug, [number, number]][])
          .map(([slug, [lat, lng]]) => ({ slug, d: (lat - coords.latitude) ** 2 + (lng - coords.longitude) ** 2 }))
          .sort((a, b) => a.d - b.d)[0]!;
        router.push(`/buscar?categoria=${oficio}&localidad=${cercana.slug}`);
      },
      () => setMensaje("No pudimos usar tu ubicación. Elige tu localidad en la búsqueda."),
      { timeout: 8000 },
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <button type="button" onClick={ubicar} className="flex h-12 items-center rounded-campo border-2 border-tinta px-6 text-base font-semibold text-tinta">Ver los más cercanos</button>
      {mensaje && <span role="status" className="text-sm text-gris">{mensaje}</span>}
    </span>
  );
}