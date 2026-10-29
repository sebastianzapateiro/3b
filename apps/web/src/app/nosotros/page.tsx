import Image from "next/image";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { FAQ_NOSOTROS } from "@/lib/faqs";
import { meta } from "@/lib/seo";

export const metadata = meta({ titulo: "Nosotros", descripcion: "LasTresB es un directorio gratuito donde encuentras en Bogotá a quien te ayude, por localidad, y le escribes directo por WhatsApp.", ruta: "/nosotros" });

const tarjeta = "rounded-[22px] border border-borde-suave bg-white shadow-[0_8px_30px_rgba(27,38,35,0.06)]";

const VALORES = [
  { titulo: "Bueno", color: "bg-verde", texto: "Identidad verificada y calificaciones de clientes reales: solo puede reseñar quien contactó al proveedor desde LasTresB." },
  { titulo: "Bonito", color: "bg-ladrillo", texto: "Pensado para el celular. Del buscador al WhatsApp en dos clics." },
  { titulo: "Barato", color: "bg-amarillo", texto: "Gratis para quien busca y para quien ofrece, y sin comisión por servicio." },
];

/** Quiénes somos. Solo afirma lo que está en la visión del proyecto (docs/00-vision.md): sin cifras ni historias inventadas. */
export default function Nosotros() {
  return (
    <>
      <main className="mx-auto flex max-w-[1100px] flex-col gap-10 px-5 pb-10 pt-6 sm:px-6 md:gap-14 md:pt-12">
        <header className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance font-display text-[34px] font-extrabold leading-[1.05] tracking-[-1px] md:text-5xl md:tracking-[-1.5px]">Quien te ayuda, <span className="text-verde">cerca de ti.</span></h1>
            <p className="text-base leading-relaxed text-tinta-2 md:text-lg">LasTresB es un directorio gratuito donde cualquier persona en Bogotá encuentra, por localidad, a un técnico, un profesor, alguien que lleve y traiga cosas o un prestador de oficios de confianza, y lo contacta directo por WhatsApp.</p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/categorias" className="flex h-[52px] items-center rounded-campo bg-tinta px-7 text-base font-semibold text-white">Buscar un servicio</Link>
              <Link href="/ingreso" className="flex h-[52px] items-center rounded-campo border-2 border-tinta px-7 text-base font-semibold text-tinta">Registrar mi servicio</Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-[0_8px_30px_rgba(27,38,35,0.12)]">
            <Image src="/fotos/nosotros.jpg" alt="Un maestro de obra trabajando en un taller de carpintería" fill priority sizes="(max-width: 768px) 100vw, 520px" className="object-cover" />
          </div>
        </header>

        <section aria-labelledby="valores" className="flex flex-col gap-4">
          <h2 id="valores" className="font-display text-2xl font-bold md:text-[32px]">Lo que nos mueve</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {VALORES.map((v) => (
              <li key={v.titulo} className={`${tarjeta} flex flex-col gap-3 p-5`}>
                <span aria-hidden="true" className={`h-2.5 w-14 rounded-full ${v.color}`} />
                <h3 className="font-display text-2xl font-extrabold">{v.titulo}</h3>
                <p className="text-[15px] leading-normal text-tinta-2">{v.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="somos" className="grid gap-5 md:grid-cols-2">
          <div className={`${tarjeta} flex flex-col gap-3 p-6`}>
            <h2 id="somos" className="font-display text-2xl font-bold">Qué somos</h2>
            <p className="text-[15px] leading-relaxed text-tinta-2">Un portal de contacto: un directorio con reputación. Mostramos proveedores verificados, sus fotos de trabajos y las reseñas de quienes ya los contrataron, y te dejamos escribirles directo.</p>
            <p className="text-[15px] leading-relaxed text-tinta-2">Hoy funcionamos solo en Bogotá, en sus 20 localidades.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-[22px] bg-tinta p-6 text-white">
            <h2 className="font-display text-2xl font-bold">Qué no somos</h2>
            <p className="text-[15px] leading-relaxed text-[#D5DCDA]">No somos intermediarios de pagos, ni empleadores, ni garantes del servicio. No fijamos precios ni asignamos trabajos: el servicio, el precio y la garantía se acuerdan entre el proveedor y tú.</p>
            <p className="text-[15px] leading-relaxed text-[#D5DCDA]">Por su nivel de riesgo, no ofrecemos transporte de personas ni servicios de salud o cuidado de personas.</p>
          </div>
        </section>

        <section aria-labelledby="confianza" className={`${tarjeta} flex flex-col gap-4 p-6`}>
          <h2 id="confianza" className="font-display text-2xl font-bold">Cómo cuidamos la confianza</h2>
          <ul className="grid gap-3 text-[15px] leading-normal text-tinta-2 md:grid-cols-2">
            <li className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-2 flex-none rounded-full bg-verde" /><span>Revisamos el documento y el WhatsApp de cada proveedor antes de publicarlo.</span></li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-2 flex-none rounded-full bg-ladrillo" /><span>En servicios de mayor riesgo solo aparecen proveedores con RUT verificado.</span></li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-2 flex-none rounded-full bg-amarillo" /><span>Quienes trabajan con menores presentan la verificación de antecedentes de la Ley 1918.</span></li>
            <li className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-2 flex-none rounded-full bg-verde" /><span>Una reseña por contacto, y el equipo modera lo que incumple la <Link href="/resenas" className="font-semibold text-verde underline">política de reseñas</Link>.</span></li>
          </ul>
          <p className="text-sm text-gris">¿Dudas o sugerencias? <Link href="/contacto" className="font-semibold text-verde underline">Escríbenos</Link>.</p>
        </section>
      </main>
      <Faq preguntas={FAQ_NOSOTROS} />
    </>
  );
}