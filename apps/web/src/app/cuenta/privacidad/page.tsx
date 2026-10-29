import Link from "next/link";
import { Aviso } from "@/components/cuenta";
import { datosPrivacidad, exigirUsuario } from "@/lib/cuenta";
import { crearSolicitudDatos } from "../actions";

/** P6 · Privacidad: solicitudes sobre tus datos (Ley 1581) y políticas aceptadas. Mockup: docs/mockups/Mi_cuenta.md. */
const tarjeta = "flex flex-col gap-4 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const TIPOS = { consulta: "Consultar mis datos", rectificacion: "Corregir mis datos", supresion: "Eliminar mis datos", exportacion: "Recibir una copia de mis datos" } as const;
const ESTADOS = { abierto: "Recibida", en_proceso: "En proceso", respondido: "Respondida", cerrado: "Cerrada" } as const;
const POLITICAS: Record<string, string> = { terminos_compradores: "Términos de uso", tratamiento_datos: "Tratamiento de datos personales", terminos_proveedores: "Términos para proveedores", aviso_privacidad: "Aviso de privacidad", cookies: "Cookies", resenas: "Política de reseñas", autorizacion_ley_1918: "Autorización Ley 1918" };
const fecha = (d: Date | string) => new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "UTC" });

export default async function Privacidad({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const u = await exigirUsuario("/cuenta/privacidad");
  const sp = await searchParams;
  const { solicitudes, aceptadas } = await datosPrivacidad(u.id);

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      <form action={crearSolicitudDatos} className={tarjeta}>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-bold">Solicitudes sobre tus datos</h2>
          <p className="text-[15px] leading-normal text-tinta-2">Tienes derecho a consultar, corregir o pedir que eliminemos tus datos (Ley 1581 de 2012). Respondemos dentro del plazo legal, contado en días hábiles.</p>
        </div>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">Tipo de solicitud</legend>
          {Object.entries(TIPOS).map(([v, t], i) => (
            <label key={v} className="flex min-h-11 items-center gap-2.5 text-[15px]"><input type="radio" name="tipo" value={v} required defaultChecked={i === 0} className="size-[18px] accent-verde" />{t}</label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="detalle" className="text-sm font-semibold">Detalle <span className="font-normal text-gris">(opcional)</span></label>
          <textarea id="detalle" name="detalle" rows={3} maxLength={1000} className="rounded-xl border-[1.5px] border-borde-campo p-3 text-base leading-normal" />
        </div>
        <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Enviar solicitud</button>
      </form>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Mis solicitudes</h2>
        {solicitudes.length === 0 ? (
          <p className="text-[15px] text-tinta-2">No has hecho solicitudes.</p>
        ) : (
          <ul className="flex flex-col">
            {solicitudes.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 border-t border-borde-suave py-3 first:border-0">
                <span className="flex flex-col"><b>{TIPOS[s.tipo]}</b><span className="text-sm text-gris">Enviada el {fecha(s.createdAt)} · respuesta antes del {fecha(s.fechaLimite)}</span></span>
                <span className="text-sm font-semibold text-tinta-2">{ESTADOS[s.estado]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Lo que aceptaste</h2>
        {aceptadas.length === 0 ? (
          <p className="text-[15px] text-tinta-2">Aún no hay aceptaciones registradas.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[15px]">
            {aceptadas.map((a, i) => <li key={i} className="flex flex-wrap justify-between gap-2"><span>{POLITICAS[a.tipo] ?? a.tipo} · versión {a.version}</span><span className="text-gris">{fecha(a.fecha)}</span></li>)}
          </ul>
        )}
        <p className="text-sm text-gris">Lee los <Link href="/terminos" className="font-semibold text-verde">términos</Link> y la <Link href="/privacidad" className="font-semibold text-verde">política de datos</Link>.</p>
      </section>
    </div>
  );
}
