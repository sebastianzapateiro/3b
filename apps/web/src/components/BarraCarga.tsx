"use client";

/**
 * Barra de carga entre páginas (heurística de Nielsen 1: visibilidad del estado del sistema).
 * Arranca al pulsar un enlace interno o enviar un formulario y termina cuando cambia la URL.
 * Solo aparece si la espera pasa de RETARDO_MS, para no parpadear en navegaciones instantáneas.
 */
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const RETARDO_MS = 150;
/** Si la URL no cambia (acción sin redirección, error de red), la barra se cierra sola. */
const TOPE_MS = 12_000;

/** true si el clic lleva a otra página del sitio y lo atiende el enrutador de Next. */
function esNavegacionInterna(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return false;
  const destino = new URL(a.href, location.href);
  if (destino.origin !== location.origin) return false;
  // Solo cambia el ancla (#seccion): no hay carga.
  return destino.pathname !== location.pathname || destino.search !== location.search;
}

function Barra() {
  const ruta = usePathname();
  const params = useSearchParams();
  const [progreso, setProgreso] = useState<number | null>(null);
  const temporizadores = useRef<number[]>([]);

  const limpiar = () => {
    temporizadores.current.forEach((t) => window.clearTimeout(t));
    temporizadores.current = [];
  };

  // Llegó la página nueva: completa la barra y la oculta.
  useEffect(() => {
    limpiar();
    setProgreso((p) => (p === null ? null : 100));
    const t = window.setTimeout(() => setProgreso(null), 250);
    return () => window.clearTimeout(t);
  }, [ruta, params]);

  useEffect(() => {
    const iniciar = () => {
      limpiar();
      temporizadores.current.push(
        window.setTimeout(() => setProgreso(15), RETARDO_MS),
        // Avanza rápido al principio y cada vez más lento: nunca llega a 100 hasta que la página responde.
        window.setTimeout(() => setProgreso(45), RETARDO_MS + 400),
        window.setTimeout(() => setProgreso(70), RETARDO_MS + 1500),
        window.setTimeout(() => setProgreso(85), RETARDO_MS + 4000),
        window.setTimeout(() => setProgreso(null), TOPE_MS),
      );
    };
    const alClic = (e: MouseEvent) => esNavegacionInterna(e) && iniciar();
    const alEnviar = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.target && form.target !== "_self") return;
      // Server Action: React cancela el envío nativo y deja action="javascript:…"; todas terminan en redirect.
      // Formularios con onSubmit propio (ingreso, registro) cancelan sin ese action y muestran su propio estado.
      const esServerAction = form.getAttribute("action")?.startsWith("javascript:") ?? false;
      if (!e.defaultPrevented || esServerAction) iniciar();
    };
    document.addEventListener("click", alClic);
    document.addEventListener("submit", alEnviar);
    window.addEventListener("popstate", iniciar);
    return () => {
      limpiar();
      document.removeEventListener("click", alClic);
      document.removeEventListener("submit", alEnviar);
      window.removeEventListener("popstate", iniciar);
    };
  }, []);

  if (progreso === null) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" role="progressbar" aria-label="Cargando la página" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progreso}>
      <div className="h-full bg-ladrillo shadow-[0_0_8px_rgba(194,69,45,0.6)] transition-[width] duration-300 ease-out" style={{ width: `${progreso}%` }} />
    </div>
  );
}

/** useSearchParams exige un límite de Suspense para no volver dinámicas las páginas estáticas. */
export function BarraCarga() {
  return (
    <Suspense fallback={null}>
      <Barra />
    </Suspense>
  );
}
