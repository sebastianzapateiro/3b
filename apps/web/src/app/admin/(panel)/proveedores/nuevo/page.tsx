import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import Link from "next/link";
import { crearProveedorAsistido, reenviarInvitacion } from "@/app/admin/actions";
import { Aviso, campoAdmin, Chip, Encabezado, tarjeta } from "@/components/admin/Ui";
import { esCorreoFicticio, estadoInvitaciones } from "@/lib/invitaciones";
import { parametro } from "@/lib/parametros";

/** B1 · Alta asistida de un proveedor (CU-51). Mockup: docs/mockups/BO_NuevoProveedor.dc.html. */
const grupo = "flex flex-col gap-1.5";
const etiqueta = "text-sm font-semibold";
const radio = "size-[18px] accent-verde";
const chip = "flex h-[38px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-borde-campo px-3.5 text-sm has-[:checked]:border-verde has-[:checked]:bg-verde has-[:checked]:font-semibold has-[:checked]:text-white";

export default async function NuevoProveedor({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [cats, locs, recientes] = await Promise.all([
    db.select({ id: schema.categorias.id, nombre: schema.categorias.nombre }).from(schema.categorias).where(isNotNull(schema.categorias.padreId)).orderBy(asc(schema.categorias.nombre)),
    db.select({ id: schema.localidades.id, nombre: schema.localidades.nombre }).from(schema.localidades).where(eq(schema.localidades.activa, true)).orderBy(asc(schema.localidades.numero)),
    db
      .select({ id: schema.proveedores.id, usuarioId: schema.proveedores.usuarioId, nombre: schema.proveedores.nombrePublico, correo: schema.user.email })
      .from(schema.proveedores)
      .innerJoin(schema.user, eq(schema.user.id, schema.proveedores.usuarioId))
      .where(eq(schema.proveedores.estado, "borrador"))
      .orderBy(desc(schema.proveedores.createdAt))
      .limit(8),
  ]);
  const [invitaciones, horas] = await Promise.all([estadoInvitaciones(recientes.map((r) => r.usuarioId)), parametro("invitacion_vigencia_h")]);

  return (
    <>
      <Encabezado
        atras={{ href: "/admin/aprobaciones", texto: "Aprobaciones" }}
        titulo="Registrar proveedor"
        subtitulo="Alta asistida para quien pide ayuda en persona o por teléfono. Tú llenas los datos; el proveedor confirma su WhatsApp y acepta términos y autorizaciones desde su propio celular."
      />

      <form action={crearProveedorAsistido} className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
          <Aviso ok={sp.ok} error={sp.error} />

          <section className={`${tarjeta} flex flex-col gap-4 p-[22px]`}>
            <h2 className="font-display text-xl font-bold"><span className="text-verde">1.</span> Segmento</h2>
            <div className="flex flex-wrap gap-[18px]">
              <fieldset className={`${grupo} flex-[1_1_200px] text-[15px]`}>
                <legend className="mb-1.5 text-sm font-semibold">Trabaja como</legend>
                <label className="flex items-center gap-2"><input type="radio" name="tipo" value="independiente" defaultChecked className={radio} />Independiente</label>
                <label className="flex items-center gap-2"><input type="radio" name="tipo" value="empresa" className={radio} />Empresa</label>
              </fieldset>
              <fieldset className={`${grupo} flex-[1_1_200px] text-[15px]`}>
                <legend className="mb-1.5 text-sm font-semibold">¿Tiene RUT?</legend>
                <label className="flex items-center gap-2"><input type="radio" name="rut" value="si" className={radio} />Sí</label>
                <label className="flex items-center gap-2"><input type="radio" name="rut" value="no" defaultChecked className={radio} />Todavía no (plazo configurable)</label>
              </fieldset>
              <fieldset className={`${grupo} flex-[1_1_200px] text-[15px]`}>
                <legend className="mb-1.5 text-sm font-semibold">¿Emite factura?</legend>
                <label className="flex items-center gap-2"><input type="radio" name="factura" value="si" className={radio} />Sí</label>
                <label className="flex items-center gap-2"><input type="radio" name="factura" value="no" defaultChecked className={radio} />No</label>
              </fieldset>
            </div>
          </section>

          <section className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
            <h2 className="font-display text-xl font-bold"><span className="text-verde">2.</span> Identificación y contacto</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className={grupo}><label htmlFor="nombreLegal" className={etiqueta}>Nombre completo o razón social</label><input id="nombreLegal" name="nombreLegal" required placeholder="Como aparece en el documento" className={campoAdmin} /></div>
              <div className={grupo}><label htmlFor="nombrePublico" className={etiqueta}>Nombre público</label><input id="nombrePublico" name="nombrePublico" required placeholder="Ej: Jorge Ramírez Plomería" className={campoAdmin} /></div>
              <div className="flex gap-2.5">
                <div className={`${grupo} w-24 flex-none`}><label htmlFor="tipoDocumento" className={etiqueta}>Tipo</label><select id="tipoDocumento" name="tipoDocumento" className={campoAdmin}><option value="cc">CC</option><option value="ce">CE</option><option value="ppt">PPT</option><option value="nit">NIT</option></select></div>
                <div className={`${grupo} min-w-0 flex-1`}><label htmlFor="documento" className={etiqueta}>Número</label><input id="documento" name="documento" required inputMode="numeric" placeholder="Sin puntos" className={campoAdmin} /></div>
              </div>
              <div className={grupo}><label htmlFor="fechaNacimiento" className={etiqueta}>Fecha de nacimiento</label><input id="fechaNacimiento" name="fechaNacimiento" type="date" className={campoAdmin} /></div>
              <div className={grupo}><label htmlFor="whatsapp" className={etiqueta}>WhatsApp del proveedor</label><input id="whatsapp" name="whatsapp" type="tel" required placeholder="+57 300 000 0000" className={campoAdmin} /></div>
              <div className={grupo}><label htmlFor="correo" className={etiqueta}>Correo del proveedor</label><input id="correo" name="correo" type="email" placeholder="Si no tiene, déjalo vacío" className={campoAdmin} /></div>
              <div className={`${grupo} sm:col-span-2`}><label htmlFor="direccion" className={etiqueta}>Dirección de notificaciones</label><input id="direccion" name="direccion" required placeholder="Dirección completa y localidad" className={campoAdmin} /></div>
            </div>
          </section>

          <section className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
            <h2 className="font-display text-xl font-bold"><span className="text-verde">3.</span> Qué ofrece y dónde</h2>
            <fieldset className={grupo}>
              <legend className="mb-2 text-sm font-semibold">Categorías</legend>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => <label key={c.id} className={chip}><input type="checkbox" name="categoria" value={c.id} className="size-4 accent-white" />{c.nombre}</label>)}
              </div>
            </fieldset>
            <fieldset className={grupo}>
              <legend className="mb-2 text-sm font-semibold">Localidades donde trabaja</legend>
              <div className="flex flex-wrap gap-2">
                {locs.map((l) => <label key={l.id} className={chip}><input type="checkbox" name="localidad" value={l.id} className="size-4 accent-white" />{l.nombre}</label>)}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3.5">
              <div className={`${grupo} flex-[2_1_240px]`}><label htmlFor="servicio" className={etiqueta}>Primer servicio</label><input id="servicio" name="servicio" placeholder="Ej: Visita de diagnóstico" className={campoAdmin} /></div>
              <div className={`${grupo} flex-[1_1_140px]`}><label htmlFor="precio" className={etiqueta}>Precio desde</label><input id="precio" name="precio" inputMode="numeric" placeholder="$ valor" className={campoAdmin} /></div>
              <div className={`${grupo} flex-[1_1_120px]`}><label htmlFor="unidad" className={etiqueta}>Por</label><select id="unidad" name="unidad" className={campoAdmin}><option value="visita">Visita</option><option value="hora">Hora</option><option value="clase">Clase</option><option value="trabajo">Trabajo</option></select></div>
            </div>
            <div className={grupo}><label htmlFor="presentacion" className={etiqueta}>Presentación</label><textarea id="presentacion" name="presentacion" rows={3} maxLength={280} placeholder="En sus palabras: experiencia, especialidad, horario (hasta 280 caracteres)" className="rounded-xl border-[1.5px] border-borde-campo p-3 text-[15px] leading-[1.45]" /></div>
            <div className={grupo}>
              <label htmlFor="slug" className={etiqueta}>Dirección de su página</label>
              <div className="flex h-11 max-w-[480px] items-center overflow-hidden rounded-xl border-[1.5px] border-verde">
                <span className="flex h-full items-center border-r-[1.5px] border-borde-campo bg-piedra px-2.5 font-mono text-[13px] font-semibold text-tinta-2">lastresb.com.co/</span>
                <input id="slug" name="slug" required placeholder="jorge-plomero-suba" className="h-full min-w-0 flex-1 px-2.5 font-mono text-sm outline-none" />
              </div>
            </div>
          </section>

          <section className={`${tarjeta} flex flex-col gap-3.5 p-[22px]`}>
            <h2 className="font-display text-xl font-bold"><span className="text-verde">4.</span> Documentos</h2>
            <p className="rounded-xl bg-piedra px-3.5 py-3 text-sm text-tinta-2">
              Al guardar te llevamos a la ficha del proveedor: ahí cargas las fotos de su documento (y RUT, matrícula o autorización si aplican), o dejas que las suba él desde su enlace de invitación.
            </p>
          </section>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section className="flex flex-col gap-3.5 rounded-[20px] border-2 border-tinta bg-white p-[22px]">
            <h2 className="font-display text-xl font-bold">Lo que hace el proveedor</h2>
            <ol className="flex flex-col gap-3 text-sm leading-[1.45]">
              <li className="flex gap-2.5"><span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-verde font-bold text-white">1</span>Recibe el enlace en su correo, y por WhatsApp si se lo envías desde su ficha. Vence en {horas} horas.</li>
              <li className="flex gap-2.5"><span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-ladrillo font-bold text-white">2</span>Crea su clave y revisa los datos que llenaste.</li>
              <li className="flex gap-2.5"><span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-amarillo font-bold text-tinta">3</span>Sube lo que falte, acepta términos y autorización de datos, firma la Ley 1918 si aplica y envía su perfil a revisión.</li>
            </ol>
            <p className="rounded-xl bg-amarillo-suave px-3.5 py-3 text-sm leading-[1.45] text-amarillo-oscuro">El equipo no puede aceptar términos ni autorizaciones por el proveedor (Ley 1581). Hasta que lo haga, el perfil queda en borrador.</p>
            <label htmlFor="origen" className="text-sm font-semibold">Cómo llegó</label>
            <select id="origen" name="origen" className={campoAdmin}><option>En persona</option><option>Por teléfono</option><option>Jornada de registro en barrio</option><option>Referido por otro proveedor</option></select>
            <button type="submit" name="accion" value="invitar" className="h-[50px] rounded-xl bg-tinta text-base font-bold text-white">Crear y enviar invitación</button>
            <button type="submit" name="accion" value="borrador" className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white text-sm font-semibold">Guardar borrador</button>
            <span className="text-[13px] leading-[1.45] text-gris">Queda en la auditoría como alta asistida por ti. Para invitar, el proveedor necesita correo: con él ingresará. Otro verificador hace la aprobación final.</span>
          </section>

          <section className={`${tarjeta} flex flex-col gap-2.5 p-[22px]`}>
            <h2 className="font-display text-lg font-bold">Invitaciones</h2>
            {recientes.length === 0 ? (
              <p className="text-sm text-gris">Aún no hay altas asistidas en borrador.</p>
            ) : (
              <ul className="flex flex-col text-sm">
                {recientes.map((r) => {
                  const inv = invitaciones.get(r.usuarioId);
                  const sinCorreo = esCorreoFicticio(r.correo);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-borde-suave py-2.5 first:border-0">
                      <Link href={`/admin/proveedores/${r.id}`} className="font-semibold hover:underline">{r.nombre}</Link>
                      <span className="flex items-center gap-2">
                        {sinCorreo ? <Chip tono="gris">Sin correo</Chip>
                          : inv?.estado === "acepto" ? <Chip tono="verde">Aceptó · completa su perfil</Chip>
                          : inv?.estado === "esperando" ? <Chip tono="amarillo">Esperando</Chip>
                          : inv?.estado === "vencio" ? <Chip tono="rojo">Venció</Chip>
                          : <Chip tono="gris">Sin enviar</Chip>}
                        {!sinCorreo && (inv?.estado === "vencio" || inv?.estado === "sin_invitacion") && (
                          <form action={reenviarInvitacion}>
                            <input type="hidden" name="proveedorId" value={r.id} />
                            <input type="hidden" name="vuelta" value="nuevo" />
                            <button type="submit" className="font-semibold text-verde hover:text-verde-oscuro">{inv?.estado === "vencio" ? "Reenviar" : "Invitar"}</button>
                          </form>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </form>
    </>
  );
}
