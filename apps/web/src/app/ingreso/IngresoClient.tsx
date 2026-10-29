"use client";

/**
 * A0 · /ingreso en dos pasos dentro de la misma página: 1) tipo de usuario, 2) métodos de ingreso con visual según el tipo.
 * Escritorio: panel con foto a la izquierda y formulario a la derecha. Celular: franja con la foto arriba.
 * TODO: fotos definitivas (hoy se usan las del banco de imágenes del proyecto, ver public/fotos/CREDITOS.md).
 */
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Aviso, BotonSocial, Separador } from "@/components/cuenta";
import { elegirTipo } from "./actions";
import { FormIngresar } from "./FormIngresar";
import { FormRegistro } from "./FormRegistro";

type Tipo = "cliente" | "proveedor";
type Aviso_ = "verificado" | "clave" | "enlace" | "oauth" | null;

const TIPOS: { id: Tipo; titulo: string; texto: string; icono: React.ReactNode }[] = [
  {
    id: "cliente",
    titulo: "Soy cliente",
    texto: "Busco un servicio y quiero contactar proveedores verificados.",
    icono: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />,
  },
  {
    id: "proveedor",
    titulo: "Soy proveedor",
    texto: "Ofrezco un servicio y quiero recibir clientes.",
    icono: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  },
];

const VISUAL: Record<Tipo, { foto: string; alt: string; titulo: string; puntos: string[]; acento: string; fondoAcento: string; tono: string }> = {
  cliente: {
    foto: "/fotos/hogar.jpg",
    alt: "Hogar con un arreglo terminado",
    titulo: "Encuentra proveedores de confianza en Bogotá",
    puntos: ["Proveedores verificados", "Reseñas reales", "Contacto directo por WhatsApp"],
    acento: "text-verde-vivo",
    fondoAcento: "bg-verde",
    tono: "from-tinta/85 via-tinta/55",
  },
  proveedor: {
    foto: "/fotos/servicios-varios.jpg",
    alt: "Persona trabajando en su oficio",
    titulo: "Consigue clientes en tu zona",
    puntos: ["Perfil propio y gratis", "Contactos por WhatsApp", "Reputación con reseñas verificadas"],
    acento: "text-amarillo",
    fondoAcento: "bg-amarillo",
    tono: "from-tinta/90 via-tinta/60",
  },
};

const AVISOS: Record<Exclude<Aviso_, null>, { tono: "exito" | "error"; texto: string }> = {
  verificado: { tono: "exito", texto: "Tu correo quedó confirmado. Ya puedes ingresar." },
  clave: { tono: "exito", texto: "Listo, cambiaste tu clave. Ingresa con la nueva." },
  enlace: { tono: "error", texto: "El enlace venció o ya se usó. Ingresa y te enviamos uno nuevo." },
  oauth: { tono: "error", texto: "No pudimos completar el ingreso. Intenta de nuevo o usa tu correo." },
};

export function IngresoClient({ destino, google, apple, aviso }: { destino: string; google: boolean; apple: boolean; aviso: Aviso_ }) {
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [modo, setModo] = useState<"ingresar" | "crear">("ingresar");
  const opciones = useRef<(HTMLButtonElement | null)[]>([]);

  async function elegir(t: Tipo) {
    setTipo(t);
    await elegirTipo(t); // El servidor guarda el tipo en una cookie: así sobrevive al ir y volver de Google o Apple.
  }

  function teclas(e: React.KeyboardEvent, i: number) {
    const paso = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    opciones.current[(i + paso + TIPOS.length) % TIPOS.length]?.focus();
  }

  const v = tipo ? VISUAL[tipo] : null;
  const pestana = (activo: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${activo ? "bg-white text-tinta shadow-sm" : "text-tinta-2"}`;

  return (
    <main className="grid min-h-[calc(100dvh-4.5rem)] grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1 lg:gap-4 lg:p-4">
      {/* Visual: franja baja en celular, panel completo en escritorio. Altura fija: no hay saltos al cambiar de tipo. */}
      <aside className="relative h-44 overflow-hidden bg-tinta text-white sm:h-56 lg:h-auto lg:rounded-[28px]" aria-label={v ? "Por qué LasTresB" : undefined}>
        {v && tipo && (
          <Image key={tipo} src={v.foto} alt={v.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${v ? v.tono : "from-tinta via-tinta"} to-tinta/20`} />
        <div className="relative flex h-full flex-col justify-end gap-3 p-5 lg:justify-between lg:p-12">
          <span className="hidden gap-2.5 lg:flex" aria-hidden="true">
            <span className="h-2.5 flex-1 rounded-full bg-verde-vivo" />
            <span className="h-2.5 flex-1 rounded-full bg-ladrillo-claro" />
            <span className="h-2.5 flex-1 rounded-full bg-amarillo" />
          </span>
          <div className="flex max-w-[480px] flex-col gap-3 lg:gap-6">
            <p className="text-balance font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.5px] sm:text-[28px] lg:text-[44px] lg:tracking-[-1.2px]">
              {v ? v.titulo : <>Quien te ayuda, <span className="text-verde-vivo">cerca de ti.</span></>}
            </p>
            {v && (
              <ul className="hidden flex-col gap-2 text-base sm:flex lg:gap-3">
                {v.puntos.map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center rounded-full ${v.fondoAcento} text-tinta`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="hidden max-w-[420px] text-sm leading-normal text-[#C9D1CF] lg:block">
            LasTresB es un directorio de contacto. El servicio, el precio y la garantía se acuerdan directamente con cada proveedor.
          </p>
        </div>
      </aside>

      <section className="flex flex-col px-6 pb-8 pt-6 lg:items-center lg:justify-center lg:px-12 lg:py-10">
        <div className="flex w-full max-w-[420px] flex-col gap-5 self-center">
          {aviso && <Aviso tono={AVISOS[aviso].tono}>{AVISOS[aviso].texto}</Aviso>}

          {!tipo ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px]">¿Cómo quieres usar LasTresB?</h1>
                <p id="pregunta-tipo" className="text-base leading-normal text-tinta-2">Elige una opción para continuar.</p>
              </div>
              <div role="radiogroup" aria-labelledby="pregunta-tipo" className="flex flex-col gap-3">
                {TIPOS.map((t, i) => (
                  <button
                    key={t.id}
                    ref={(el) => { opciones.current[i] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={false}
                    tabIndex={i === 0 ? 0 : -1}
                    onClick={() => elegir(t.id)}
                    onKeyDown={(e) => teclas(e, i)}
                    className="flex min-h-[88px] items-center gap-4 rounded-[20px] border-[1.5px] border-borde-campo bg-white p-4 text-left hover:border-tinta focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
                  >
                    <span aria-hidden="true" className={`flex size-12 flex-none items-center justify-center rounded-2xl ${t.id === "cliente" ? "bg-verde-claro text-verde-oscuro" : "bg-amarillo-suave text-amarillo-oscuro"}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icono}</svg>
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <b className="font-display text-xl">{t.titulo}</b>
                      <span className="text-[15px] leading-snug text-tinta-2">{t.texto}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold ${tipo === "cliente" ? "bg-verde-claro text-verde-oscuro" : "bg-amarillo-suave text-amarillo-oscuro"}`}>
                    {tipo === "cliente" ? "Soy cliente" : "Soy proveedor"}
                  </span>
                  <button type="button" onClick={() => setTipo(null)} className="inline-flex min-h-11 items-center text-sm font-semibold text-verde hover:text-verde-oscuro">Cambiar</button>
                </div>
                <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px]">
                  {modo === "ingresar" ? "Hola de nuevo" : tipo === "cliente" ? "Crea tu cuenta" : "Crea tu cuenta de proveedor"}
                </h1>
                <p className="text-base leading-normal text-tinta-2">
                  {tipo === "cliente"
                    ? "La necesitas para calificar a quienes contactaste por LasTresB."
                    : "Es gratis. Después completas tus datos y el equipo revisa tu perfil antes de publicarlo."}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {google && <BotonSocial proveedor="google" destino={destino} />}
                {apple && <BotonSocial proveedor="apple" destino={destino} />}
                {/* TODO: Apple Sign-In: falta APPLE_CLIENT_ID y APPLE_CLIENT_SECRET (cuenta de Apple Developer). */}
              </div>
              {(google || apple) && <div className="-my-1"><Separador /></div>}

              <div role="tablist" aria-label="Continuar con correo" className="flex rounded-2xl bg-piedra p-1">
                <button type="button" role="tab" aria-selected={modo === "ingresar"} onClick={() => setModo("ingresar")} className={pestana(modo === "ingresar")}>Ya tengo cuenta</button>
                <button type="button" role="tab" aria-selected={modo === "crear"} onClick={() => setModo("crear")} className={pestana(modo === "crear")}>Crear cuenta</button>
              </div>
              {modo === "ingresar" ? <FormIngresar destino={destino} /> : <FormRegistro alIngresar={() => setModo("ingresar")} />}
              <p className="text-center text-sm leading-snug text-gris">
                Con Google o Apple solo usamos tu nombre, correo y foto para crear la cuenta, y antes te pedimos confirmación.{" "}
                <Link href="/privacidad" className="font-semibold text-verde underline">Datos personales</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
