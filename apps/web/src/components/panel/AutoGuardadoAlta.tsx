"use client";

/**
 * P8 · Alta en una sola página (CU-30): guarda sola cada campo marcado con `data-alta` (los que no están dentro de un <form>), al salir del
 * campo o a los 1,2 s sin escribir, y al cambiar de pestaña. Muestra «Guardando… / Guardado» y avisa lo que no se pudo guardar,
 * sin perder nada de lo ya escrito. Si cambia algo de lo que dependen otras secciones (oficios, localidades), refresca la página.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Respuesta = { guardados?: string[]; avisos?: Record<string, string>; recargar?: boolean };

const ETIQUETA: Record<string, string> = {
  nombrePublico: "Nombre público", whatsapp: "WhatsApp", slug: "Dirección de tu página", presentacion: "Sobre ti", aniosExperiencia: "Años de experiencia",
  documento: "Número de documento", fechaNacimiento: "Fecha de nacimiento", direccionNotificaciones: "Dirección", categoria: "Oficios", redes: "Redes sociales",
};

export function AutoGuardadoAlta({ children }: { children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [estado, setEstado] = useState<"quieto" | "guardando" | "guardado" | "error">("quieto");
  const [avisos, setAvisos] = useState<Record<string, string>>({});
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enVuelo = useRef(false);
  const pendiente = useRef(false);

  const leer = useCallback(() => {
    const datos: Record<string, string | string[]> = {};
    raiz.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[name], select[name], textarea[name]").forEach((el) => {
      if (el.closest("form") || !el.closest("[data-alta]") || el.disabled) return;
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      const previo = datos[el.name];
      if (el.name === "categoria" || el.name === "localidad") datos[el.name] = [...((previo as string[]) ?? []), el.value];
      else datos[el.name] = el.value;
    });
    return datos;
  }, []);

  const guardar = useCallback(async () => {
    if (enVuelo.current) { pendiente.current = true; return; }
    enVuelo.current = true;
    setEstado("guardando");
    try {
      const r = await fetch("/api/v1/yo/alta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(leer()) });
      if (!r.ok) throw new Error("falló");
      const j = (await r.json()) as Respuesta;
      setAvisos(j.avisos ?? {});
      setEstado("guardado");
      if (j.recargar) router.refresh();
      else if (j.guardados?.length) router.refresh(); // el avance y las marcas del menú se actualizan
    } catch {
      setEstado("error");
    } finally {
      enVuelo.current = false;
      if (pendiente.current) { pendiente.current = false; void guardar(); }
    }
  }, [leer, router]);

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const programar = () => { clearTimeout(temporizador.current); temporizador.current = setTimeout(guardar, 1200); };
    const ahora = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.closest("form") || !t.closest("[data-alta]")) return;
      clearTimeout(temporizador.current);
      void guardar();
    };
    const escribiendo = (e: Event) => { const t = e.target as HTMLElement | null; if (t && !t.closest("form") && t.closest("[data-alta]")) programar(); };
    const alSalir = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(temporizador.current);
        navigator.sendBeacon("/api/v1/yo/alta", new Blob([JSON.stringify(leer())], { type: "application/json" }));
      }
    };
    el.addEventListener("input", escribiendo);
    el.addEventListener("change", ahora);
    el.addEventListener("focusout", ahora);
    document.addEventListener("visibilitychange", alSalir);
    return () => { clearTimeout(temporizador.current); el.removeEventListener("input", escribiendo); el.removeEventListener("change", ahora); el.removeEventListener("focusout", ahora); document.removeEventListener("visibilitychange", alSalir); };
  }, [guardar, leer]);

  const lista = Object.entries(avisos);
  return (
    <div ref={raiz} className="flex flex-col gap-5">
      <div aria-live="polite" className="sticky top-0 z-30 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-borde-suave bg-crema/95 px-4 py-2.5 text-sm shadow-sm backdrop-blur">
        <span className="text-tinta-2">Todo se guarda solo mientras escribes.</span>
        <span className={`font-semibold ${estado === "error" ? "text-ladrillo-oscuro" : estado === "guardado" ? "text-verde-oscuro" : "text-gris"}`}>
          {estado === "guardando" ? "Guardando…" : estado === "guardado" ? "✓ Guardado" : estado === "error" ? "No pudimos guardar: revisa tu conexión" : ""}
        </span>
      </div>
      {lista.length > 0 && (
        <div role="status" className="flex flex-col gap-1 rounded-2xl bg-amarillo-suave p-4 text-sm text-amarillo-oscuro">
          <b>Esto todavía no se pudo guardar:</b>
          <ul className="list-disc pl-5">{lista.map(([k, v]) => <li key={k}><b>{ETIQUETA[k] ?? k}:</b> {v}</li>)}</ul>
        </div>
      )}
      {children}
    </div>
  );
}
