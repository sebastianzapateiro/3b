import { exigirProveedor, verificacionDelProveedor } from "@/lib/panel";

/** P8 · Estado de la verificación: documentos e insignias (CU-30). Mockup: docs/mockups/Panel_proveedor.md. */
const DOCS: Record<string, string> = {
  documento_frente: "Cédula · frente",
  documento_reverso: "Cédula · reverso",
  rut: "RUT",
  camara_comercio: "Cámara de comercio",
  matricula: "Matrícula o certificación",
  autorizacion_ley_1918: "Autorización Ley 1918 (menores)",
};
const INSIGNIAS = [
  { clave: "verificado", nombre: "Verificado", como: "Se otorga cuando el equipo aprueba tu perfil." },
  { clave: "formalizado", nombre: "Formalizado", como: "Se otorga cuando tu RUT está verificado." },
  { clave: "certificado", nombre: "Certificado en su oficio", como: "Sube tu matrícula o certificación para solicitarla." },
  { clave: "apto_menores", nombre: "Apto para menores", como: "Para clases y recreacionistas, que trabajan con menores: firmas la autorización (Ley 1918) y el equipo consulta el registro. Dura 6 meses." },
];
const fecha = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "UTC" });

export default async function Verificacion() {
  const { proveedor: p } = await exigirProveedor();
  const v = await verificacionDelProveedor(p.id);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold">Insignias</h2>
        <ul className="flex flex-col">
          {INSIGNIAS.map((i) => {
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

      <section className="flex flex-col gap-3 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold">Documentos</h2>
        <ul className="flex flex-col">
          {Object.entries(DOCS).map(([tipo, texto]) => {
            const cargado = v.documentos.includes(tipo);
            return (
              <li key={tipo} className="flex items-center justify-between gap-2 border-t border-borde-suave py-3 first:border-0">
                <span className="text-[15px]">{texto}</span>
                <span className={`text-sm font-semibold ${cargado ? "text-verde-oscuro" : "text-gris"}`}>{cargado ? "Cargado" : "Sin cargar"}</span>
              </li>
            );
          })}
        </ul>
        <p className="rounded-[14px] bg-piedra p-4 text-sm leading-normal text-tinta-2">
          Tus documentos son privados: solo los ve el equipo de verificación y cada apertura queda registrada. La carga desde este panel se habilita cuando se conecte el almacenamiento privado; mientras tanto, el equipo te los pide al revisar tu perfil.
        </p>
      </section>
    </div>
  );
}
