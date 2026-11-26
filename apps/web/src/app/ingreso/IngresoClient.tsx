"use client";

/**
 * A0 · /ingreso: ingreso y registro de proveedores. El registro de cliente no se ofrece: quien llega a calificar un servicio
 * (destino /…/calificar) entra con el tipo «cliente»; todos los demás, como proveedores. Los clientes dejan sus datos al contactar.
 * Escritorio: panel con foto a la izquierda y formulario a la derecha. Celular: franja con la foto arriba.
 * TODO: fotos definitivas (hoy se usan las del banco de imágenes del proyecto, ver public/fotos/CREDITOS.md).
 */
import { AyudaInscripcion } from "@/components/AyudaInscripcion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Aviso, BotonSocial, Separador } from "@/components/cuenta";
import { elegirTipo } from "./actions";
import { FormIngresar } from "./FormIngresar";
import { FormRegistro } from "./FormRegistro";

type Tipo = "cliente" | "proveedor";
type Aviso_ = "verificado" | "clave" | "enlace" | "oauth" | null;

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
    titulo: "Haz que encuentren tu trabajo en LasTresB",
    puntos: [
      "Aparece en el directorio de servicios de Bogotá",
      "Muestra lo que haces y dónde trabajas",
      "Recibe contactos directos por WhatsApp",
      "Sin inscripción, comisiones ni mensualidades",
    ],
    acento: "text-verde-vivo",
    fondoAcento: "bg-verde",
    tono: "from-tinta/85 via-tinta/55",
  },
};

const AVISOS: Record<Exclude<Aviso_, null>, { tono: "exito" | "error"; texto: string }> = {
  verificado: { tono: "exito", texto: "Tu correo quedó confirmado. Ya puedes ingresar." },
  clave: { tono: "exito", texto: "Listo, cambiaste tu clave. Ingresa con la nueva." },
  enlace: { tono: "error", texto: "El enlace venció o ya se usó. Ingresa y te enviamos uno nuevo." },
  oauth: { tono: "error", texto: "No pudimos completar el ingreso. Intenta de nuevo o usa tu correo." },
};

/** Texto de apoyo móvil: muestra en mobile, oculta en lg+ */
const textoApoyoMobile = "Completa tu perfil y, después de nuestra revisión, podrás aparecer en el directorio para que potenciales clientes encuentren tus servicios.";

export function IngresoClient({ destino, google, apple, aviso, oficios, tipo }: { destino: string; google: boolean; apple: boolean; aviso: Aviso_; oficios: { id: string; nombre: string; slug: string; grupo: string }[]; tipo: Tipo }) {
  const [modo, setModo] = useState<"ingresar" | "crear">(aviso ? "ingresar" : "crear") // tras confirmar el correo o cambiar la clave toca ingresar;

  // El servidor guarda el tipo en una cookie: así sobrevive al ir y volver de Google o Apple y lo leen los hooks del registro.
  useEffect(() => {
    void elegirTipo(tipo);
  }, [tipo]);

  const v = VISUAL[tipo];
  const pestana = (activo: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-semibold ${activo ? "bg-white text-tinta shadow-sm" : "text-tinta-2"}`;

  return (
    // `minmax(0, 1fr)`: en pantallas muy angostas la columna no crece con el contenido (evita que el formulario se salga por los lados).
    <main className="grid min-h-[calc(100dvh-4.5rem)] grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1 lg:gap-4 lg:p-4">
      {/* Visual: franja baja en celular, panel completo en escritorio. Altura fija: no hay saltos al cambiar de tipo. */}
      <aside className="relative h-32 min-w-0 overflow-hidden bg-tinta text-white sm:h-56 lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)] lg:self-start lg:rounded-[28px]" aria-label="Por qué LasTresB">
        <Image key={tipo} src={v.foto} alt={v.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-t ${v.tono} to-tinta/20`} />
        <div className="relative flex h-full flex-col justify-end gap-3 p-5 lg:justify-between lg:p-12">
          <span className="hidden gap-2.5 lg:flex" aria-hidden="true">
            <span className="h-2.5 flex-1 rounded-full bg-verde-vivo" />
            <span className="h-2.5 flex-1 rounded-full bg-ladrillo-claro" />
            <span className="h-2.5 flex-1 rounded-full bg-amarillo" />
          </span>
          <div className="flex max-w-[480px] flex-col gap-3 lg:gap-6">
            <p className="text-balance font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.5px] sm:text-[28px] lg:text-[44px] lg:tracking-[-1.2px]">{v.titulo}</p>
            {/* En móvil mostramos los 4 beneficios como lista vertical; en escritorio (lg) también visibles */}
            <ul className="flex flex-col gap-2 text-sm">
              {v.puntos.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`flex size-5 flex-none items-center justify-center rounded-full ${v.fondoAcento} text-tinta`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-normal text-tinta-2">
            {textoApoyoMobile}
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col px-6 pb-8 pt-6 lg:items-center lg:justify-center lg:px-12 lg:py-12">
        <div className="flex w-full min-w-0 max-w-[420px] flex-col gap-6 self-center">
          {aviso && <Aviso tono={AVISOS[aviso].tono}>{AVISOS[aviso].texto}</Aviso>}

          <div className="flex flex-col gap-2">
            <span className={`inline-flex h-8 items-center self-start rounded-full px-3 text-sm font-semibold ${tipo === "cliente" ? "bg-verde-claro text-verde-oscuro" : "bg-amarillo-suave text-amarillo-oscuro"}`}>
              {tipo === "cliente" ? "Soy cliente" : "Soy proveedor"}
            </span>
            <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px]">
              {modo === "ingresar" ? "Hola de nuevo" : tipo === "cliente" ? "Crea tu cuenta" : "Registra tus servicios gratis"}
            </h1>
            {/* En celular no hace falta el texto: quien llega aquí ya sabe a qué vino. */}
            <p className="text-base leading-normal text-tinta-2">
              {tipo === "cliente"
                ? "La necesitas para calificar a quienes contactaste por LasTresB."
                : modo === "ingresar"
                  ? "100% gratis y sin comisión: tus clientes te escriben directo por WhatsApp."
                  : textoApoyoMobile}
            </p>
          </div>


          <div role="tablist" aria-label="Continuar con correo" className="flex rounded-2xl bg-piedra p-1">
            <button type="button" role="tab" aria-selected={modo === "crear"} onClick={() => setModo("crear")} className={pestana(modo === "crear")}>Crear cuenta</button>
            <button type="button" role="tab" aria-selected={modo === "ingresar"} onClick={() => setModo("ingresar")} className={pestana(modo === "ingresar")}>Ya tengo cuenta</button>
          </div>
          {modo === "ingresar" ? <FormIngresar destino={destino} /> : <FormRegistro proveedor={tipo === "proveedor"} oficios={oficios} alIngresar={() => setModo("ingresar")} />}
          {(google || apple) && (
            <div className="flex flex-col gap-2.5">
              <div className="-mb-3 -mt-1"><Separador texto={modo === "crear" ? "o crea tu cuenta con Google" : "o ingresa con Google"} /></div>
              {google && <BotonSocial proveedor="google" destino={destino} />}
              {apple && <BotonSocial proveedor="apple" destino={destino} />}
              {/* TODO: Apple Sign-In: falta APPLE_CLIENT_ID y APPLE_CLIENT_SECRET (cuenta de Apple Developer). */}
            </div>
          )}          <p className="text-center text-sm leading-snug text-gris">
            Con Google o Apple solo usamos tu nombre, correo y foto para crear la cuenta, y antes te pedimos confirmación.{" "}
            <Link href="/privacidad" className="font-semibold text-verde underline">Datos personales</Link>
          </p>
          <AyudaInscripcion tipo={tipo} />
        </div>
      </section>
    </main>
  );
}
