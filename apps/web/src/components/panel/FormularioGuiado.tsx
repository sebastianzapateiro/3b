"use client";

/**
 * Formulario que, al guardar con campos sin diligenciar, dice cuáles faltan, los marca en rojo y lleva
 * hasta el primero (con scroll y foco), en vez de que el navegador solo abra el teclado sin explicar.
 * Reconoce: campos con `required`/`pattern`/`minLength`, grupos de radios requeridos y `fieldset[data-minimo]`
 * (mínimo de casillas marcadas). La etiqueta sale de `label[for]` o de la `legend` del grupo.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";

type Falta = { id: string; etiqueta: string; detalle: string };

/** Campos de texto que se autoguardan en el borrador (lib/borrador.ts). */
const AUTOGUARDADOS = ["nombrePublico", "whatsapp", "presentacion", "direccionNotificaciones", "numeroMatricula"];

const textoDe = (el: Element | null) => (el?.textContent ?? "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();

export function FormularioGuiado({ action, id, className, children }: { action: (f: FormData) => void | Promise<void>; id?: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [guardado, setGuardado] = useState(false);

  // Autoguardado: tras 1,5 s sin escribir (y al salir de la pantalla) se guardan los campos de texto ya válidos.
  useEffect(() => {
    const form = ref.current;
    if (!form || !AUTOGUARDADOS.some((n) => form.elements.namedItem(n))) return;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const cuerpo = () => {
      const datos: Record<string, string> = {};
      for (const n of AUTOGUARDADOS) {
        const el = form.elements.namedItem(n);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) datos[n] = el.value;
      }
      return JSON.stringify(datos);
    };
    const guardar = () => {
      fetch("/api/v1/yo/borrador", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo(), keepalive: true })
        .then((r) => r.json())
        .then((j: { guardados?: string[] }) => { if (j.guardados?.length) { setGuardado(true); setTimeout(() => setGuardado(false), 2500); } })
        .catch(() => {});
    };
    const programar = () => { clearTimeout(temporizador); temporizador = setTimeout(guardar, 1500); };
    const alSalir = () => { if (document.visibilityState === "hidden" && temporizador) { clearTimeout(temporizador); temporizador = undefined; navigator.sendBeacon("/api/v1/yo/borrador", new Blob([cuerpo()], { type: "application/json" })); } };
    form.addEventListener("input", programar);
    document.addEventListener("visibilitychange", alSalir);
    return () => { clearTimeout(temporizador); form.removeEventListener("input", programar); document.removeEventListener("visibilitychange", alSalir); };
  }, []);

  function revisar(e: React.FormEvent<HTMLFormElement>) {
    const form = ref.current;
    if (!form) return;
    form.querySelectorAll("[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
    const encontradas: (Falta & { el: HTMLElement })[] = [];
    let n = 0;
    const idDe = (el: HTMLElement) => (el.id ||= `campo-guiado-${++n}`);

    // Campos sueltos (los radios se revisan por grupo, más abajo).
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), select, textarea").forEach((el) => {
      if (el.checkValidity()) return;
      const etiqueta = textoDe(el.id ? form.querySelector(`label[for="${el.id}"]`) : el.closest("div")?.querySelector("label") ?? null) || el.name;
      const vacio = !el.value.trim();
      encontradas.push({ id: idDe(el), etiqueta, detalle: vacio ? "Falta completarlo." : el.validationMessage || "Revisa lo que escribiste.", el });
    });

    // Grupos de radios requeridos y grupos de casillas con mínimo.
    form.querySelectorAll<HTMLFieldSetElement>("fieldset").forEach((g) => {
      const radios = g.querySelectorAll<HTMLInputElement>("input[type=radio][required]");
      const minimo = Number(g.dataset.minimo ?? 0);
      const marcadas = g.querySelectorAll("input:checked").length;
      const falta = (radios.length > 0 && marcadas === 0) || (minimo > 0 && marcadas < minimo);
      if (!falta) return;
      encontradas.push({ id: idDe(g), etiqueta: textoDe(g.querySelector("legend")), detalle: "Elige una opción.", el: g });
    });

    if (encontradas.length === 0) { setFaltas([]); return; }
    e.preventDefault();
    // En el orden en que aparecen en la página.
    encontradas.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    encontradas.forEach((f) => f.el.setAttribute("aria-invalid", "true"));
    setFaltas(encontradas.map(({ id, etiqueta, detalle }) => ({ id, etiqueta, detalle })));
    ir(encontradas[0]!.el);
  }

  function ir(el: HTMLElement) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const foco = el instanceof HTMLFieldSetElement ? el.querySelector<HTMLElement>("input") : el;
    foco?.focus({ preventScroll: true });
  }

  return (
    <form ref={ref} id={id} action={action} onSubmit={revisar} noValidate className={`${className ?? ""} [&_[aria-invalid=true]]:border-ladrillo [&_[aria-invalid=true]]:bg-ladrillo-suave/40 [&_fieldset[aria-invalid=true]]:rounded-2xl [&_fieldset[aria-invalid=true]]:border-[1.5px] [&_fieldset[aria-invalid=true]]:border-ladrillo [&_fieldset[aria-invalid=true]]:p-3`}>
      {faltas.length > 0 && (
        <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-ladrillo-suave p-4 text-ladrillo-oscuro">
          <b className="text-[15px]">{faltas.length === 1 ? "Te falta 1 campo:" : `Te faltan ${faltas.length} campos:`}</b>
          <ul className="flex flex-col gap-1 text-[15px]">
            {faltas.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => { const el = document.getElementById(f.id); if (el) ir(el); }} className="min-h-9 text-left font-semibold underline">{f.etiqueta}</button>
                <span> · {f.detalle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
      <p aria-live="polite" className="min-h-4 text-xs text-gris">{guardado ? "Borrador guardado" : ""}</p>
    </form>
  );
}
