import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CRITERIOS, contactoSinResena, proveedorPorSlug, yaCalifico } from "@/lib/resenas";
import { calificarProveedor } from "./actions";

/** P5 · Calificar a un proveedor (CU-20). Mockup: docs/mockups/Calificar.md. */
export const metadata = { title: "Calificar a este proveedor", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const aviso = "rounded-[18px] p-4 text-[15px] leading-normal";

export default async function Calificar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; gracias?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const proveedor = await proveedorPorSlug(slug);
  if (!proveedor) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/ingreso?${new URLSearchParams({ destino: `/${slug}/calificar` })}`);

  const anonimoId = (await cookies()).get("anonimo_id")?.value ?? null;
  const propio = proveedor.usuarioId === session.user.id;
  const contacto = propio ? null : await contactoSinResena(proveedor.id, session.user.id, anonimoId);
  const calificado = !contacto && !propio && (await yaCalifico(proveedor.id, session.user.id));

  return (
    <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-5 pb-14 pt-4 sm:pt-10">
      <Link href={`/${slug}`} className="inline-flex h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-tinta-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        Volver al perfil
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-[-1px] sm:text-4xl">Califica a {proveedor.nombre}</h1>
        <p className="text-base leading-normal text-tinta-2">Tu opinión ayuda a tus vecinos a elegir bien. Cuenta lo que pasó, sin insultos.</p>
      </div>

      {sp.gracias ? (
        <div className={`${aviso} bg-verde-claro text-verde-oscuro`} role="status">
          <b>¡Gracias por calificar!</b> Tu reseña ya aparece en el perfil de {proveedor.nombre}.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/${slug}#resenas`} className="flex h-11 items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Ver reseñas</Link>
            <Link href="/cuenta/actividad" className="flex h-11 items-center rounded-xl border-2 border-tinta px-4 text-sm font-semibold text-tinta">Mis reseñas</Link>
          </div>
        </div>
      ) : propio ? (
        <div className={`${aviso} bg-piedra`}>Este es tu propio perfil: no puedes calificarte.</div>
      ) : calificado ? (
        <div className={`${aviso} bg-piedra`}>Ya calificaste a este proveedor por tu último contacto. Si lo vuelves a contactar desde LasTresB, podrás calificarlo otra vez.</div>
      ) : !contacto ? (
        <div className={`${aviso} bg-amarillo-suave text-amarillo-oscuro`}>
          <b>Primero contáctalo.</b> Para mantener las reseñas reales, solo puede calificar quien escribió al proveedor desde LasTresB.
          <a href={`/api/v1/contactos/ir?p=${slug}&origen=perfil`} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-12 items-center justify-center rounded-campo bg-verde text-base font-semibold text-white">Escribir por WhatsApp</a>
        </div>
      ) : (
        <form action={calificarProveedor} className="flex flex-col gap-5 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
          <input type="hidden" name="slug" value={slug} />
          {sp.error && <p role="alert" className={`${aviso} bg-ladrillo-suave text-ladrillo-oscuro`}>{sp.error}</p>}

          {CRITERIOS.map((c) => (
            <fieldset key={c.clave} className="flex flex-col gap-2">
              <legend className="text-base font-bold">{c.texto}</legend>
              <span className="text-sm text-gris">{c.ayuda}</span>
              {/* Estrellas de 1 a 5: radios nativos, se rellenan hasta la elegida sin JavaScript. */}
              <div className="flex flex-row-reverse justify-end gap-1 [&>label:hover~label]:text-amarillo [&>label:hover]:text-amarillo">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="peer-checked:text-amarillo flex size-11 cursor-pointer items-center justify-center text-[#CFC6B5] has-[:checked]:text-amarillo [&:has(:checked)~label]:text-amarillo">
                    <input type="radio" name={c.clave} value={n} required className="peer sr-only" aria-label={`${n} de 5`} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="#B88600" strokeWidth="1" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="comentario" className="text-base font-bold">Cuéntanos más <span className="font-normal text-gris">(opcional)</span></label>
            <textarea id="comentario" name="comentario" rows={4} maxLength={500} placeholder="¿Qué trabajo hizo? ¿Qué te gustó o qué mejorarías?" className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
            <span className="text-xs text-gris">Hasta 500 caracteres. Tu nombre aparece junto a la reseña.</span>
          </div>

          <button type="submit" className="h-[54px] rounded-campo bg-tinta text-[17px] font-semibold text-white">Publicar reseña</button>
        </form>
      )}
    </main>
  );
}
