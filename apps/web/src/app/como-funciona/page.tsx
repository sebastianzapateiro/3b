import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { Faq } from "@/components/Faq";
import { Estrella, TarjetaProveedor } from "@/components/TarjetaProveedor";
import { RECOMENDADOS_DEMO } from "@/lib/demo";
import { FAQ_COMO_FUNCIONA } from "@/lib/faqs";
import { absoluta, jsonLdMigas , meta } from "@/lib/seo";

/** ¿Cómo funciona? (P2). Paso a paso para quien busca y para quien ofrece; las imágenes son ejemplos hechos con los mismos componentes del portal. */
export const metadata: Metadata = meta({ titulo: "¿Cómo funciona LasTresB? Paso a paso", descripcion: "Busca un servicio en tu localidad de Bogotá, compara reseñas y escribe directo por WhatsApp. Gratis y sin comisiones. Así de fácil.", ruta: "/como-funciona" });

const PASOS_COMPRADOR = [
  {
    titulo: "Busca lo que necesitas",
    texto: "En el inicio escribe el servicio, como «plomero» o «clases de inglés», y elige tu localidad. También puedes entrar por categorías o por localidad.",
    imagen: "busqueda",
  },
  {
    titulo: "Compara proveedores",
    texto: "Mira la calificación, las reseñas de clientes reales, las insignias de verificación y en qué localidades atiende cada uno.",
    imagen: "tarjeta",
  },
  {
    titulo: "Revisa su portafolio",
    texto: "Entra a su página para ver fotos de trabajos, lo que ofrece y lo que dicen sus clientes antes de decidir.",
    imagen: "resena",
  },
  {
    titulo: "Escríbele por WhatsApp",
    texto: "Pulsa el botón y cuéntale qué necesitas. Acuerdan precio, fecha y garantía directamente, sin intermediarios ni comisiones. Deja lo pactado por escrito en el chat.",
    imagen: "whatsapp",
  },
  {
    titulo: "Cuenta cómo te fue",
    texto: "Si lo contactaste desde LasTresB, puedes dejar una reseña con hechos. Así ayudas a tus vecinos a elegir bien.",
    imagen: null,
  },
] as const;

const PASOS_PROVEEDOR = [
  { titulo: "Crea tu cuenta gratis", texto: "Regístrate con tu correo o con Google. Debes ser mayor de edad y aceptar los términos." },
  { titulo: "Completa tu perfil", texto: "Cuenta qué servicios ofreces, en qué localidades trabajas y sube fotos de tus trabajos." },
  { titulo: "Verificamos tus datos", texto: "Revisamos tu documento y tu WhatsApp antes de publicarte. Algunos servicios piden además RUT o verificación para trabajar con menores." },
  { titulo: "Comparte tu página", texto: "Tendrás una dirección propia (lastresb.com.co/tu-nombre) y un código QR para volantes y redes. Los clientes te escriben directo por WhatsApp." },
];

/** Marco para los ejemplos: deja claro que es una ilustración y no se puede pulsar. */
function Ejemplo({ children, nota }: { children: React.ReactNode; nota: string }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div inert aria-hidden="true" className="select-none rounded-[22px] border border-borde-suave bg-crema p-4">
        {children}
      </div>
      <figcaption className="text-xs text-gris">{nota}</figcaption>
    </figure>
  );
}

function Imagen({ tipo }: { tipo: (typeof PASOS_COMPRADOR)[number]["imagen"] }) {
  const prov = RECOMENDADOS_DEMO[0]!;
  if (tipo === "busqueda") {
    return (
      <Ejemplo nota="Ejemplo ilustrativo del buscador del inicio.">
        <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-3.5 shadow-[0_6px_24px_rgba(27,38,35,0.08)]">
          <span className="text-[13px] font-semibold text-gris">Servicio o clase</span>
          <span className="flex h-12 items-center rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta">plomero</span>
          <span className="text-[13px] font-semibold text-gris">Localidad</span>
          <span className="flex h-12 items-center rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta">Suba</span>
          <span className="flex h-12 items-center justify-center rounded-campo bg-tinta text-base font-semibold text-white">Buscar</span>
        </div>
      </Ejemplo>
    );
  }
  if (tipo === "tarjeta") {
    return (
      <Ejemplo nota="Ejemplo ilustrativo de un resultado. Proveedor de muestra.">
        <TarjetaProveedor proveedor={prov} />
      </Ejemplo>
    );
  }
  if (tipo === "resena") {
    return (
      <Ejemplo nota="Ejemplo ilustrativo de una reseña. Texto de muestra.">
        <article className="flex flex-col gap-2 rounded-[18px] border border-borde-suave bg-white p-4">
          <span className="flex items-center gap-1 text-sm font-bold"><Estrella /> {prov.promedio.toString().replace(".", ",")} · {prov.totalResenas} reseñas</span>
          <p className="text-[15px] leading-normal text-tinta-2">«Llegó puntual, me explicó qué había dañado y el precio fue el que acordamos.»</p>
          <span className="text-[13px] text-gris">Cliente verificado · Suba</span>
        </article>
      </Ejemplo>
    );
  }
  if (tipo === "whatsapp") {
    return (
      <Ejemplo nota="Ejemplo ilustrativo del botón de contacto.">
        <div className="flex flex-col gap-3 rounded-[18px] bg-white p-4">
          <b className="text-base">{prov.nombre}</b>
          <span className="flex h-13 items-center justify-center rounded-campo bg-verde px-6 text-base font-bold text-white">Escribir por WhatsApp</span>
          <span className="text-xs text-gris">Acuerdas precio y fecha directo con el proveedor.</span>
        </div>
      </Ejemplo>
    );
  }
  return null;
}

export default function ComoFunciona() {
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Cómo contratar un servicio en LasTresB",
    inLanguage: "es-CO",
    step: PASOS_COMPRADOR.map((p, i) => ({ "@type": "HowToStep", position: i + 1, name: p.titulo, text: p.texto, url: `${absoluta("/como-funciona")}#paso-${i + 1}` })),
  };

  return (
    <>
      <JsonLd datos={jsonLdMigas([{ nombre: "Inicio", ruta: "/" }, { nombre: "¿Cómo funciona?", ruta: "/como-funciona" }])} />
      <JsonLd datos={howTo} />
      <main className="mx-auto flex max-w-[1000px] flex-col gap-8 px-5 pb-14 pt-4 sm:gap-12 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance font-display text-[32px] font-extrabold tracking-[-1px] sm:text-5xl">¿Cómo funciona LasTresB?</h1>
          <p className="max-w-[600px] text-base leading-normal text-tinta-2 sm:text-lg">
            Encuentras a quien te ayude en tu localidad y le escribes directo por WhatsApp. Es gratis y no cobramos comisiones.
          </p>
        </div>

        <section aria-labelledby="comprador" className="flex flex-col gap-6">
          <h2 id="comprador" className="font-display text-2xl font-bold sm:text-[32px]">Si buscas un servicio</h2>
          <ol className="flex flex-col gap-8">
            {PASOS_COMPRADOR.map((p, i) => (
              <li key={p.titulo} id={`paso-${i + 1}`} className="grid scroll-mt-24 items-center gap-5 md:grid-cols-2 md:gap-10">
                <div className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-verde text-lg font-bold text-white">{i + 1}</span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-xl font-bold">{p.titulo}</h3>
                    <p className="text-base leading-relaxed text-tinta-2">{p.texto}</p>
                  </div>
                </div>
                {p.imagen && <div className={i % 2 === 1 ? "md:order-first" : ""}><Imagen tipo={p.imagen} /></div>}
              </li>
            ))}
          </ol>
          <Link href="/categorias" className="flex h-13 items-center justify-center self-start rounded-campo bg-tinta px-7 text-base font-semibold text-white">
            Buscar un servicio
          </Link>
        </section>

        <section aria-labelledby="proveedor" className="flex flex-col gap-6 rounded-[28px] bg-white p-5 sm:p-8">
          <h2 id="proveedor" className="font-display text-2xl font-bold sm:text-[32px]">Si ofreces un servicio</h2>
          <ol className="grid gap-5 sm:grid-cols-2">
            {PASOS_PROVEEDOR.map((p, i) => (
              <li key={p.titulo} className="flex items-start gap-3.5">
                <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-amarillo font-bold text-tinta">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-lg font-bold">{p.titulo}</h3>
                  <p className="text-[15px] leading-relaxed text-tinta-2">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/ingreso" className="flex h-13 items-center justify-center self-start rounded-campo bg-amarillo px-7 text-base font-bold text-tinta">
            Registrarme como proveedor
          </Link>
        </section>
      </main>
      <Faq preguntas={FAQ_COMO_FUNCIONA} />
    </>
  );
}
