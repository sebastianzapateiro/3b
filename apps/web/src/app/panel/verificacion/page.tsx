import { FormularioGuiado } from "@/components/panel/FormularioGuiado";
import Link from "next/link";
import { Aviso } from "@/components/cuenta";
import { CargaDocumento } from "@/components/CargaDocumento";
import { pendientesAlta } from "@/lib/alta-proveedor";
import { guardarIdentidadPanel } from "../actions";
import { estadoDocumentos } from "@/lib/documentos";
import { exigirProveedor, verificacionDelProveedor } from "@/lib/panel";

/**
 * P8 · Estado de la verificación: datos de identidad (en borrador), documentos e insignias (CU-30).
 * Carga de documentos privados (regla 2). El documento nunca se vuelve a mostrar: se guarda cifrado (regla 1).
 * Mockup: docs/mockups/Panel_proveedor.md.
 */
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";
const tarjeta = "flex scroll-mt-24 flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const INSIGNIAS = [
  { clave: "verificado", nombre: "Verificado", como: "Se otorga cuando el equipo aprueba tu perfil." },
  { clave: "formalizado", nombre: "Formalizado", como: "Se otorga cuando tu RUT está verificado." },
  { clave: "certificado", nombre: "Certificado en su oficio", como: "Sube tu matrícula o certificación para solicitarla." },
  { clave: "apto_menores", nombre: "Apto para menores", como: "Para clases y recreacionistas, que trabajan con menores: firmas la autorización (Ley 1918) y el equipo consulta el registro. Dura 6 meses." },
];
/** En qué paso va la solicitud, según el estado del perfil. */
const PASO: Record<string, string> = {
  pendiente: "Recibimos tu solicitud y el equipo la está revisando. Te avisamos por correo cuando tengamos respuesta.",
  en_revision: "Tu perfil ya es visible, aunque el equipo sigue observándolo. Las insignias se otorgan a medida que se verifica cada documento.",
  aprobado: "Tu perfil fue aprobado y ya está publicado. Las insignias se otorgan a medida que se verifica cada documento.",
  rechazado: "Tu solicitud necesita correcciones. Mira el motivo en el Resumen, corrígelo y vuelve a enviarla.",
  pausado: "Tu perfil está en pausa. Puedes reactivarlo desde el Resumen.",
  pausado_por_rut: "Tu perfil está en pausa porque falta tu RUT. Cárgalo en Documentos para reactivarlo.",
  suspendido: "Tu perfil está suspendido. Escríbenos desde la página de reclamos para revisarlo.",
};
const fecha = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "UTC" });

export default async function Verificacion({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { proveedor: p } = await exigirProveedor();
  const sp = await searchParams;
  const borrador = p.estado === "borrador";
  const [v, docs, alta] = await Promise.all([verificacionDelProveedor(p.id), estadoDocumentos(p.id), borrador ? pendientesAlta(p.id) : null]);
  // Solo se explican las insignias que corresponden a su oficio y tipo de trabajo (a una aseadora no se le habla de matrícula ni de RUT).
  const aplica = (tipo: string) => docs.lista.some((d) => d.tipo === tipo && d.exigido);
  const insigniasQueAplican = INSIGNIAS.filter((i) => i.clave === "verificado" || (i.clave === "formalizado" && aplica("rut")) || (i.clave === "certificado" && aplica("matricula")) || (i.clave === "apto_menores" && aplica("autorizacion_ley_1918")));
  const identidadLista = alta?.tareas.find((t) => t.clave === "identidad")?.ok ?? false;

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      {borrador && (
        <FormularioGuiado id="identidad" action={guardarIdentidadPanel} className={tarjeta}>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold">Tus datos de identidad</h2>
            <p className="text-sm leading-normal text-gris">
              {identidadLista ? "Ya los guardaste. Si necesitas corregirlos, escríbelos de nuevo y guarda." : "Los usa solo el equipo de verificación. No aparecen en tu página ni se comparten."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_200px] flex-col gap-1.5">
              <label htmlFor="tipoDocumento" className="text-sm font-semibold">Tipo de documento</label>
              <select id="tipoDocumento" name="tipoDocumento" required defaultValue="cc" className={campo}>
                <option value="cc">Cédula de ciudadanía</option>
                <option value="ce">Cédula de extranjería</option>
                <option value="ppt">Permiso por protección temporal (PPT)</option>
                <option value="nit">NIT</option>
              </select>
            </div>
            <div className="flex flex-[1_1_200px] flex-col gap-1.5">
              <label htmlFor="documento" className="text-sm font-semibold">Número</label>
              <input id="documento" name="documento" required inputMode="numeric" autoComplete="off" placeholder="Sin puntos ni espacios" className={campo} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="direccionNotificaciones" className="text-sm font-semibold">Dirección de notificaciones</label>
            <input id="direccionNotificaciones" name="direccionNotificaciones" required autoComplete="street-address" placeholder="Calle 123 # 45-67, Bogotá" className={campo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fechaNacimiento" className="text-sm font-semibold">Fecha de nacimiento</label>
            <input id="fechaNacimiento" name="fechaNacimiento" type="date" required autoComplete="bday" className={`${campo} sm:max-w-56`} />
          </div>
          <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar datos de identidad</button>
        </FormularioGuiado>
      )}
      <section id="documentos" className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Documentos</h2>
        {alta && !alta.tareas.find((t) => t.clave === "negocio")?.ok && (
          <p className="rounded-[14px] bg-amarillo-suave px-4 py-3 text-sm text-amarillo-oscuro">Completa primero los <Link href="/panel/perfil#negocio" className="font-semibold underline">datos y oficios</Link>: según tu oficio y si eres empresa, te pedimos otros documentos.</p>
        )}
        {p.rutFechaLimite && !docs.lista.find((d) => d.tipo === "rut")?.cargado && (
          <p className="rounded-[14px] bg-amarillo-suave px-4 py-3 text-sm font-semibold text-amarillo-oscuro">Carga tu RUT antes del {fecha(p.rutFechaLimite)} para que tu página siga publicada.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {docs.lista.map((d) => (
            <CargaDocumento key={d.tipo} doc={d} />
          ))}
        </div>
        <p className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
          Tus documentos son privados: solo los ve el equipo de verificación y cada apertura queda registrada. Subirlos es opcional: la foto de tu documento solo sirve para verificar tu identidad y nunca se publica. Si cambias un archivo, el nuevo reemplaza al anterior.
        </p>
      </section>
      {!borrador && (
        <section className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">Cómo va tu solicitud</h2>
          <p className="rounded-[14px] bg-piedra p-4 text-[15px] leading-normal text-tinta-2">{PASO[p.estado] ?? PASO.pendiente}</p>
          <h3 className="font-display text-lg font-bold">Insignias que puedes tener</h3>
          <ul className="flex flex-col">
            {insigniasQueAplican.map((i) => {
              const tiene = v.insignias.find((x) => x.clave === i.clave);
              return (
                <li key={i.clave} className="flex flex-wrap items-center justify-between gap-2 border-t border-borde-suave py-3 first:border-0">
                  <span className="flex flex-col"><b className="text-[15px]">{i.nombre}</b><span className="text-sm text-gris">{tiene ? (tiene.vence ? `Vigente hasta ${fecha(tiene.vence)}` : "Vigente") : i.como}</span></span>
                  <span className={`flex h-7 items-center rounded-full px-3 text-[13px] font-semibold ${tiene ? "bg-verde-claro text-verde-oscuro" : "bg-piedra text-tinta-2"}`}>{tiene ? "Otorgada" : "Pendiente"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </div>
  );
}
