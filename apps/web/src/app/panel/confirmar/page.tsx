import Link from "next/link";
import { redirect } from "next/navigation";
import { enviarARevision } from "@/app/panel/actions";
import { Aviso } from "@/components/cuenta";
import { CargaDocumento } from "@/components/CargaDocumento";
import { estadoDocumentos } from "@/lib/documentos";
import { datosParaConfirmar, exigirProveedor } from "@/lib/panel";

/**
 * P3 / CU-51 · El proveedor registrado por el equipo (alta asistida) revisa sus datos, sube lo que falte,
 * acepta términos y autorizaciones él mismo (Ley 1581, regla 5) y envía su perfil a revisión.
 */
const tarjeta = "flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const casilla = "mt-0.5 size-5 flex-none accent-verde";

export default async function Confirmar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { proveedor: p } = await exigirProveedor();
  if (p.estado !== "borrador") redirect("/panel");
  const sp = await searchParams;
  const [datos, docs] = await Promise.all([datosParaConfirmar(p.id), estadoDocumentos(p.id)]);

  return (
    <div className="flex flex-col gap-5">
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}
      <p className="rounded-[18px] bg-amarillo-suave p-4 text-[15px] leading-normal text-amarillo-oscuro">
        El equipo de LasTresB llenó tu registro con los datos que nos diste. Revísalos, sube lo que falte y, si todo está bien, envíalo a revisión. Nada de esto se publica hasta que lo aprobemos.
      </p>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">1. Revisa tus datos</h2>
        <dl className="grid gap-x-4 gap-y-2 text-[15px] sm:grid-cols-[180px_minmax(0,1fr)]">
          <dt className="text-gris">Nombre público</dt><dd>{p.nombre}</dd>
          <dt className="text-gris">Tu página</dt><dd className="font-mono text-sm">lastresb.com.co/{p.slug}</dd>
          <dt className="text-gris">Qué ofreces</dt><dd>{datos.categorias.join(", ") || "—"}</dd>
          <dt className="text-gris">Dónde trabajas</dt><dd>{datos.localidades.join(", ") || "—"}</dd>
          <dt className="text-gris">Servicios con precio</dt><dd>{datos.servicios}</dd>
          <dt className="text-gris">Presentación</dt><dd>{p.presentacion || "—"}</dd>
        </dl>
        <p className="text-sm text-gris">
          ¿Algo no está bien? Corrige tu <Link href="/panel/perfil" className="font-semibold text-verde underline">perfil</Link> o tus{" "}
          <Link href="/panel/servicios" className="font-semibold text-verde underline">servicios</Link>. Si es el nombre, la página o tus documentos de identidad, escríbenos.
        </p>
      </section>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">2. Tus documentos</h2>
        <div className="flex flex-col gap-2.5">
          {docs.lista.map((d) => <CargaDocumento key={d.tipo} doc={d} />)}
        </div>
        <p className="text-sm text-gris">Son privados: solo los ve el equipo de verificación y cada apertura queda registrada.</p>
      </section>

      <form action={enviarARevision} className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">3. Acepta y envía</h2>
        <fieldset className="flex flex-col gap-3 text-sm leading-snug text-tinta-2">
          <legend className="sr-only">Autorizaciones</legend>
          <label className="flex items-start gap-2"><input type="checkbox" name="aceptaTerminosProveedor" required className={casilla} /><span>Acepto los <Link href="/terminos-proveedores" target="_blank" className="font-semibold text-verde underline">términos de uso para proveedores</Link> y entiendo que el servicio, el precio y la garantía los acuerdo con cada cliente.</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" name="aceptaDatos" required className={casilla} /><span>Autorizo el tratamiento de mis datos personales (documento, fecha de nacimiento, dirección) para verificar mi identidad, según la <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</Link>.</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" name="declaraNoPermitidos" required className={casilla} /><span>Declaro que no ofreceré transporte de personas ni servicios de salud o cuidado de personas.</span></label>
          {datos.exigeLey1918 && (
            <label className="flex items-start gap-2"><input type="checkbox" name="autorizaLey1918" required className={casilla} /><span>Mi categoría trabaja con menores. Autorizo la consulta de antecedentes en el registro de inhabilidades (Ley 1918 de 2018) para recibir la insignia «Apto para menores».</span></label>
          )}
        </fieldset>
        {docs.faltan.length > 0 && <p className="text-sm font-semibold text-ladrillo-oscuro">Antes de enviar, carga: {docs.faltan.join(", ")}.</p>}
        <button type="submit" className="h-[52px] rounded-campo bg-tinta text-base font-semibold text-white">Enviar a revisión</button>
      </form>
    </div>
  );
}
