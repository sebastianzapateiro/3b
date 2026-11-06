"use client";

/**
 * A0 · Botón flotante «¿Ofreces un servicio? Te ayudamos a inscribirte» (CU-30), solo para proveedores. Va en el layout global.
 * - No se muestra en /admin ni en el panel. En /ingreso es la única ayuda (ya no hay tarjeta) y su texto es corto: «Te ayudamos a inscribirte».
 * - En el perfil de un proveedor queda solo como ícono y sin animación (CSS: html[data-perfil], ver MarcaPerfilPublico), para no competir con «Contactar por WhatsApp».
 * - Se oculta con cualquier otro modal abierto o con el aviso de cookies (CSS en globals.css) y sube sobre el pie de página.
 * - Con sesión: un proveedor inscrito no lo ve; un cliente sí, sin animación.
 * El panel se carga solo al abrirlo. El estado «reducido» se recuerda en localStorage (si falla, funciona igual).
 */
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { EVENTO_ABRIR_AYUDA, eventoAyuda, type OrigenAyuda } from "@/lib/ayuda-inscripcion";

const Panel = dynamic(() => import("@/components/ayuda/PanelAyudaProveedor"), { ssr: false });

const CLAVE = "ayuda_proveedor_v1";
const SIN_AYUDA = ["/admin", "/panel", "/proveedores/registro"];
const empieza = (ruta: string, p: string) => ruta === p || ruta.startsWith(`${p}/`);

function leerReducido(): boolean {
  try {
    return localStorage.getItem(CLAVE) === "reducido";
  } catch {
    return false;
  }
}
function guardarReducido(v: boolean) {
  try {
    localStorage.setItem(CLAVE, v ? "reducido" : "expandido");
  } catch {}
}

function IconoLlave() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
    </svg>
  );
}

export function AyudaProveedor() {
  const ruta = usePathname();
  const { data, isPending } = authClient.useSession();
  const usuarioId = data?.user.id;
  const [esProveedor, setEsProveedor] = useState(false);
  const [reducido, setReducido] = useState(false);
  const [porScroll, setPorScroll] = useState(false);
  const [sube, setSube] = useState(0);
  const [cargado, setCargado] = useState(false); // el panel se monta la primera vez que se abre
  const [abierto, setAbierto] = useState(false);
  const [origen, setOrigen] = useState<OrigenAyuda>("boton_flotante");
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => setReducido(leerReducido()), []);

  // Con sesión: ¿ya es proveedor? (mismo endpoint que usa el menú de usuario).
  useEffect(() => {
    if (!usuarioId) return setEsProveedor(false);
    fetch("/api/v1/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setEsProveedor(Boolean(j?.proveedor)))
      .catch(() => {});
  }, [usuarioId]);

  const abrir = useCallback((o: OrigenAyuda) => {
    setOrigen(o);
    setCargado(true);
    setAbierto(true);
    eventoAyuda("ayuda_abrir_panel", o);
  }, []);

  // Otros puntos de entrada (tarjeta de /ingreso, menú del celular) abren el mismo panel.
  useEffect(() => {
    const alAbrir = (e: Event) => abrir((e as CustomEvent<{ origen?: OrigenAyuda }>).detail?.origen ?? "boton_flotante");
    window.addEventListener(EVENTO_ABRIR_AYUDA, alAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR_AYUDA, alAbrir);
  }, [abrir]);

  // Celular: a los pocos segundos de hacer scroll se reduce a solo el ícono. Todas las pantallas: sube sobre el pie de página.
  useEffect(() => {
    let temporizador: number | undefined;
    let cuadro = 0;
    const alScroll = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const movil = window.innerWidth < 1024;
        if (movil && window.scrollY > 120) temporizador ??= window.setTimeout(() => setPorScroll(true), 2500);
        if (window.scrollY < 40) {
          clearTimeout(temporizador);
          temporizador = undefined;
          setPorScroll(false);
        }
        const pie = document.querySelector("footer");
        const arriba = pie ? pie.getBoundingClientRect().top : Infinity;
        setSube(arriba < window.innerHeight ? Math.round(window.innerHeight - arriba) : 0);
      });
    };
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      clearTimeout(temporizador);
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, [ruta]);

  if (SIN_AYUDA.some((p) => empieza(ruta, p)) || isPending || esProveedor) return null;

  const enIngreso = empieza(ruta, "/ingreso");
  const compacto = reducido || porScroll;
  const conSesion = Boolean(usuarioId);

  function cerrarX() {
    setReducido(true);
    guardarReducido(true);
  }

  return (
    <>
      {(

        <div
          className="ayuda-flotante fixed z-30 right-[max(1rem,env(safe-area-inset-right))]"
          style={{ bottom: `calc(max(1rem, env(safe-area-inset-bottom)) + ${sube}px)` }}
        >
          <button
            ref={boton}
            type="button"
            onClick={() => abrir(enIngreso ? "ingreso" : "boton_flotante")}
            aria-label="Ayuda para inscribirte como proveedor"
            aria-haspopup="dialog"
            className={`ayuda-boton flex min-h-12 items-center justify-center rounded-full bg-amarillo font-semibold text-tinta shadow-[0_6px_20px_rgba(27,38,35,0.28)] hover:brightness-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta ${compacto ? "size-12" : "gap-2 pl-4 pr-11"} ${conSesion ? "" : "ayuda-pulso"}`}
          >
            <IconoLlave />
            {!compacto && (
              <span className="ayuda-texto text-sm leading-tight">
                <span className={enIngreso ? "hidden" : "hidden lg:inline"}>¿Ofreces un servicio? Te ayudamos a inscribirte</span>
                <span className={enIngreso ? "" : "lg:hidden"}>Te ayudamos a inscribirte</span>
              </span>
            )}
          </button>
          {!compacto && (
            <button type="button" onClick={cerrarX} aria-label="Reducir el botón de ayuda" className="ayuda-cerrar absolute -right-3 -top-3 flex size-11 items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-tinta">
              <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-tinta text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </span>
            </button>
          )}
        </div>
      )}
      {cargado && (
        <Panel
          abierto={abierto}
          origen={origen}
          alCerrar={() => {
            setAbierto(false);
            boton.current?.focus();
          }}
        />
      )}
    </>
  );
}
