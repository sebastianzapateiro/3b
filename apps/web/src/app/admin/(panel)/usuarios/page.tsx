import Link from "next/link";
import { cambiarClaveUsuario, cambiarExigencia2fa, crearPerfilesProveedorFaltantes, crearUsuario, eliminarUsuario, guardarRoles, restablecerDosFactor, suspenderUsuario } from "@/app/admin/actions";
import { Aviso, botonOscuro, campoAdmin, Chip, Encabezado, etiquetaAdmin, tarjeta } from "@/components/admin/Ui";
import { listarUsuarios } from "@/lib/admin";
import { CLAVE_MAX, CLAVE_MIN } from "@/lib/claves";
import { exigencia2fa, exigirBackoffice } from "@/lib/verificacion";
import { MOTIVO_SERVICIOS_NO_PERMITIDOS } from "@las3b/shared";

/** B4 · Usuarios: crear, roles, suspensión y eliminación (CU-70 a CU-72, CU-27). Solo administradores. Mockup: docs/mockups/BO_Usuarios.dc.html. */
const ROLES = [
  { v: "comprador", t: "Comprador" },
  { v: "proveedor", t: "Proveedor" },
  { v: "verificador", t: "Verificador" },
  { v: "moderador", t: "Moderador" },
  { v: "admin", t: "Admin" },
];
const TONO_ROL: Record<string, "gris" | "verde" | "amarillo" | "rojo"> = { comprador: "gris", proveedor: "verde", verificador: "amarillo", moderador: "rojo", admin: "amarillo" };
const ROLES_EQUIPO = ["admin", "verificador", "moderador"];
const ESTADO_PROVEEDOR: Record<string, string> = { borrador: "Borrador", pendiente: "Pendiente", aprobado: "Aprobado", en_revision: "En revisión", rechazado: "Rechazado", pausado: "Pausado", pausado_por_rut: "Pausado por RUT", suspendido: "Suspendido" };
/** Opciones del filtro «Mostrar». Comprador y Proveedor se deciden por el perfil (no solo por el rol); «sin_rol» sigue aceptándose en la URL (sin rol de equipo). */
const OPCIONES_FILTRO = ROLES;
const fecha = (d: Date | null) => (d ? new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" }) : "—");

export const metadata = { title: "Usuarios" };

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirBackoffice(true);
  const sp = await searchParams;
  // Filtro por tipo de usuario o rol: arranca con todos marcados (se ve el 100 %) y el admin desmarca los que no quiere.
  const TODOS = ROLES.map((x) => x.v);
  const filtroAplicado = sp.f === "1";
  const filtroRoles = (filtroAplicado ? ([] as (string | undefined)[]).concat(sp.rol) : TODOS).filter((r): r is string => Boolean(r)).filter((r) => [...ROLES.map((x) => x.v), "sin_rol"].includes(r));
  const [lista, exige2fa] = await Promise.all([filtroRoles.length > 0 ? listarUsuarios(sp.q, filtroRoles.length === TODOS.length ? [] : filtroRoles) : Promise.resolve([]), exigencia2fa()]);
  const filtroUrl = `${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${filtroAplicado ? "&f=1" : ""}${filtroRoles.map((r) => `&rol=${r}`).join("")}`;
  const resumenFiltro = !filtroAplicado || filtroRoles.length === TODOS.length ? "Todos" : filtroRoles.length === 0 ? "Ninguno" : filtroRoles.map((v) => ROLES.find((r) => r.v === v)?.t ?? "Sin rol de equipo").join(", ");
  const creando = sp.nuevo === "1";
  const sinPerfil = lista.filter((u) => u.roles.includes("proveedor") && !u.perfilProveedor).length;
  const elegido = creando ? undefined : (lista.find((u) => u.id === sp.u) ?? lista[0]);

  return (
    <>
      <Encabezado titulo="Usuarios y roles" subtitulo="Solo administradores · cada cambio queda en la auditoría">
        <form className="flex h-11 min-w-0 flex-[0_1_380px] items-center gap-2 rounded-xl border-[1.5px] border-borde-campo bg-white px-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6663" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input name="q" type="search" defaultValue={sp.q} aria-label="Buscar usuario" placeholder="Correo, nombre o teléfono" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </form>
        <Link href="/admin/usuarios?nuevo=1" className={botonOscuro}>Crear usuario</Link>
      </Encabezado>

      <main className="flex flex-wrap items-start gap-6 px-5 pb-10 pt-6 lg:px-8">
        <section className="flex min-w-0 flex-[1_1_100%] flex-col gap-4">
        {sinPerfil > 0 && (
          <form action={crearPerfilesProveedorFaltantes} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-amarillo-suave p-4 text-amarillo-oscuro">
            <span className="text-[15px]"><b>{sinPerfil} {sinPerfil === 1 ? "cuenta tiene" : "cuentas tienen"} el rol Proveedor y no {sinPerfil === 1 ? "tiene" : "tienen"} perfil.</b> Se crea en borrador: nadie lo ve hasta que se apruebe.</span>
            <button type="submit" className={botonOscuro}>Crear perfiles en borrador</button>
          </form>
        )}
        {/* Filtro por tipo o rol: un menú desplegable en vez de todas las opciones a la vista. */}
        <form method="get" className="flex flex-wrap items-center gap-3">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <input type="hidden" name="f" value="1" />
          <details className="relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border-[1.5px] border-borde-campo bg-white px-4 text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="text-gris">Mostrar:</span> {resumenFiltro}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="absolute left-0 z-20 mt-1.5 flex w-64 flex-col gap-0.5 rounded-2xl border border-borde-suave bg-white p-2 shadow-[0_8px_30px_rgba(27,38,35,0.14)]">
              <p className="px-2 pb-1 pt-1 text-[13px] text-gris">Elige qué usuarios quieres ver</p>
              {OPCIONES_FILTRO.map((r) => (
                <label key={r.v} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[15px] hover:bg-piedra">
                  <input type="checkbox" name="rol" value={r.v} defaultChecked={filtroRoles.includes(r.v)} className="size-[18px] accent-verde" />
                  {r.t}
                </label>
              ))}
              <button type="submit" className="mt-1 h-10 rounded-xl bg-tinta text-sm font-semibold text-white">Aplicar</button>
            </div>
          </details>
          {filtroAplicado && <Link href={`/admin/usuarios${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ""}`} className="flex min-h-11 items-center px-1 text-sm font-semibold text-verde underline">Mostrar todos</Link>}
          <span className="text-sm text-gris" role="status">{lista.length} {lista.length === 1 ? "usuario" : "usuarios"}{lista.length === 50 ? " (los 50 más recientes: afina con la búsqueda)" : ""}</span>
        </form>

        <div className={`${tarjeta} min-w-0 overflow-x-auto`}>
          <table className="w-full min-w-[920px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-crema text-left text-gris">
                {["Usuario", "Teléfono", "Tipo y roles", "Estado", "Último ingreso", ""].map((h) => <th key={h || "acc"} className="whitespace-nowrap px-3.5 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[15px] text-gris">{filtroRoles.length === 0 ? "No hay ningún tipo de usuario marcado. Elige al menos uno en «Mostrar»." : "No hay usuarios con ese criterio."}</td></tr>}
              {lista.map((u) => {
                const suspendido = u.suspendidoHasta && new Date(u.suspendidoHasta) > new Date();
                const sinCorreo = u.correo.endsWith(".invalid");
                return (
                  <tr key={u.id} className={`border-t border-borde-suave align-top ${u.id === elegido?.id ? "bg-piedra" : ""}`}>
                    <td className="max-w-[300px] px-3.5 py-3">
                      <Link href={`/admin/usuarios?u=${u.id}${filtroUrl}`} className="flex flex-col hover:underline">
                        <b className="text-[14px]">{u.nombre}</b>
                        <span className="truncate text-gris">{sinCorreo ? "Sin correo (alta asistida)" : u.correo}</span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3">{u.telefono || <span className="text-gris">—</span>}</td>
                    <td className="px-3.5 py-3">
                      <span className="flex flex-wrap gap-1">
                        {u.perfilProveedor ? (
                          <Link href={`/admin/proveedores/${u.perfilProveedor.id}`} title="Ver perfil de proveedor"><Chip tono="verde">Proveedor · {ESTADO_PROVEEDOR[u.perfilProveedor.estado] ?? u.perfilProveedor.estado}</Chip></Link>
                        ) : u.roles.includes("proveedor") ? (
                          <Chip tono="verde">Proveedor · sin perfil</Chip>
                        ) : (
                          <Chip tono="gris">Comprador</Chip>
                        )}
                        {u.roles.filter((r) => ROLES_EQUIPO.includes(r)).map((r) => <Chip key={r} tono={TONO_ROL[r] ?? "gris"}>{ROLES.find((x) => x.v === r)?.t ?? r}</Chip>)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3">{u.eliminadoEn ? <span className="font-semibold text-gris">Eliminada</span> : suspendido ? <span className="font-semibold text-ladrillo-oscuro">Suspendido hasta {fecha(u.suspendidoHasta)}</span> : <span className="font-semibold text-verde-oscuro">Activo{u.dosFactor ? " · 2FA" : ""}</span>}</td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-gris">{fecha(u.ultimoIngreso)}</td>
                    <td className="px-3.5 py-3">
                      <Link href={u.proveedorId ? `/admin/proveedores/${u.proveedorId}` : `/admin/usuarios?u=${u.id}${filtroUrl}`} className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border-[1.5px] border-tinta px-3 font-semibold text-tinta hover:bg-piedra">Ver perfil</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </section>

        <form action={cambiarExigencia2fa} className={`${tarjeta} order-last flex min-w-0 flex-[3_1_520px] flex-col gap-3 p-[22px]`}>
          <h2 className="font-display text-xl font-bold">Segundo factor por rol</h2>
          <p className="text-sm leading-normal text-gris">Decide qué roles del equipo deben usar código de app autenticadora para entrar. Quien ya lo tiene activo lo sigue usando. Si una persona tiene varios roles, se le exige si alguno de ellos lo exige.</p>
          <ul className="flex flex-col">
            {[
              { v: "admin", t: "Admin", fijo: true, nota: "Siempre obligatorio: ve datos y documentos de todo el sistema." },
              { v: "verificador", t: "Verificador", fijo: false, nota: "Revisa documentos de identidad." },
              { v: "moderador", t: "Moderador", fijo: false, nota: "Modera reseñas y reportes." },
            ].map((r) => (
              <li key={r.v} className="flex items-center justify-between gap-3 border-t border-borde-suave py-3 first:border-0">
                <span className="flex flex-col"><b className="text-[15px]">{r.t}</b><span className="text-[13px] text-gris">{r.nota}</span></span>
                <label className={`flex items-center gap-2 text-sm font-semibold ${r.fijo ? "text-gris" : ""}`}>
                  <input type="checkbox" name={r.v} defaultChecked={exige2fa[r.v as keyof typeof exige2fa]} disabled={r.fijo} className="size-5 accent-verde" />
                  Exigir 2FA
                </label>
              </li>
            ))}
          </ul>
          <button type="submit" className="h-[42px] self-start rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Guardar</button>
        </form>

        {creando && (
          <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-[18px]">
            <Aviso ok={sp.ok} error={sp.error} />
            <form action={crearUsuario} className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">Crear usuario</h2>
              <label htmlFor="nombre" className={etiquetaAdmin}>Nombre</label>
              <input id="nombre" name="nombre" required minLength={2} maxLength={80} autoComplete="off" placeholder="Ej: Laura Gómez" className={campoAdmin} />
              <label htmlFor="correo" className={etiquetaAdmin}>Correo</label>
              <input id="correo" name="correo" type="email" required maxLength={120} autoComplete="off" placeholder="nombre@correo.com" className={campoAdmin} />
              <fieldset className="mt-1 flex flex-col gap-2.5 text-[15px]">
                <legend className={`${etiquetaAdmin} mb-2`}>Roles</legend>
                {ROLES.map((r) => (
                  <label key={r.v} className="flex items-center gap-2.5"><input type="checkbox" name="rol" value={r.v} className="size-5 accent-verde" />{r.t}</label>
                ))}
              </fieldset>
              <span className="text-[13px] leading-[1.45] text-gris">Le enviamos un correo para que elija su clave. Al entrar por primera vez acepta las políticas y, si su rol lo exige, activa el 2FA.</span>
              <div className="flex gap-2">
                <button type="submit" className={botonOscuro}>Crear y enviar invitación</button>
                <Link href="/admin/usuarios" className="inline-flex h-11 items-center px-3 text-sm font-semibold text-gris">Cancelar</Link>
              </div>
            </form>
          </section>
        )}

        {elegido?.eliminadoEn && (
          <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-[18px]">
            <Aviso ok={sp.ok} error={sp.error} />
            <div className={`${tarjeta} flex flex-col gap-2 p-[22px]`}>
              <h2 className="font-display text-xl font-bold">{elegido.nombre} · cuenta eliminada</h2>
              <p className="text-sm leading-normal text-gris">
                Eliminada el {fecha(elegido.eliminadoEn)}. No puede ingresar, su perfil de proveedor está oculto y sus reseñas salen anónimas.
                Los datos se conservan bloqueados hasta el {fecha(elegido.conservarHasta)} (CU-27).
              </p>
            </div>
          </section>
        )}

        {elegido && !elegido.eliminadoEn && (
          <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-[18px]">
            <Aviso ok={sp.ok} error={sp.error} />
            <form action={guardarRoles} className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
              <input type="hidden" name="usuarioId" value={elegido.id} />
              <h2 className="font-display text-xl font-bold">{elegido.nombre} · roles</h2>
              <fieldset className="flex flex-col gap-2.5 text-[15px]">
                <legend className="sr-only">Roles</legend>
                {ROLES.map((r) => (
                  <label key={r.v} className="flex items-center gap-2.5"><input type="checkbox" name="rol" value={r.v} defaultChecked={elegido.roles.includes(r.v)} className="size-5 accent-verde" />{r.t}</label>
                ))}
              </fieldset>
              <span className="text-[13px] leading-[1.45] text-gris">Admin siempre exige 2FA; verificador y moderador, según «Segundo factor por rol». El último Admin no puede quitarse el rol.</span>
              <button type="submit" className="h-[42px] self-start rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Guardar roles</button>
            </form>

            <form action={cambiarClaveUsuario} className={`${tarjeta} flex flex-col gap-3 p-[22px]`}>
              <input type="hidden" name="usuarioId" value={elegido.id} />
              <h2 className="font-display text-xl font-bold">Cambiar clave</h2>
              <label htmlFor="clave" className={etiquetaAdmin}>Clave nueva</label>
              <input id="clave" name="clave" type="password" required minLength={CLAVE_MIN} maxLength={CLAVE_MAX} autoComplete="new-password" placeholder="Mínimo 8 caracteres" className={campoAdmin} />
              <label htmlFor="confirmacion" className={etiquetaAdmin}>Repite la clave</label>
              <input id="confirmacion" name="confirmacion" type="password" required minLength={CLAVE_MIN} maxLength={CLAVE_MAX} autoComplete="new-password" placeholder="La misma de arriba" className={campoAdmin} />
              <span className="text-[13px] leading-[1.45] text-gris">Se cierran sus sesiones, se anulan las invitaciones pendientes y le avisamos por correo. Compártele la clave por un canal privado. El 2FA no cambia.</span>
              <button type="submit" className="h-[42px] self-start rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Cambiar clave</button>
            </form>

            <div className="flex flex-col gap-3 rounded-[20px] border border-[#F0C9BE] bg-white p-[22px]">
              <h2 className="font-display text-xl font-bold">Suspender cuenta</h2>
              <form action={suspenderUsuario} className="flex flex-col gap-3">
                <input type="hidden" name="usuarioId" value={elegido.id} />
                <fieldset className="flex flex-col gap-2 text-sm">
                  <legend className="sr-only">Tipo</legend>
                  <label className="flex items-start gap-2.5"><input type="radio" name="tipo" value="aviso" defaultChecked className="mt-0.5 size-[18px] accent-verde" /><span><b>Con aviso previo</b><br /><span className="text-gris">Recibe el motivo y tiene 5 días hábiles para dar su versión</span></span></label>
                  <label className="flex items-start gap-2.5"><input type="radio" name="tipo" value="provisional" className="mt-0.5 size-[18px] accent-verde" /><span><b>Provisional inmediata</b><br /><span className="text-gris">Solo fraude, amenazas o riesgo para personas</span></span></label>
                </fieldset>
                <label htmlFor="predefinido" className="text-sm font-semibold">Motivo predefinido</label>
                <select id="predefinido" name="predefinido" className={campoAdmin}><option value="">Otro (lo escribo abajo)</option><option value={MOTIVO_SERVICIOS_NO_PERMITIDOS}>{MOTIVO_SERVICIOS_NO_PERMITIDOS}</option></select>
                <label htmlFor="motivo" className="text-sm font-semibold">Detalle del motivo</label>
                <input id="motivo" name="motivo" placeholder="Ej: reclamos repetidos por incumplimiento" className={campoAdmin} />
                <label htmlFor="duracion" className="text-sm font-semibold">Duración (solo suspensión provisional)</label>
                <div className="flex gap-2">
                  <select id="duracion" name="duracion" className={campoAdmin}><option value="fecha">Hasta una fecha</option><option value="indefinida">Indefinida</option></select>
                  <input name="hasta" type="date" aria-label="Fecha" className={campoAdmin} />
                </div>
                <span className="text-[13px] text-gris">Al suspender se cierran todas sus sesiones y se oculta su perfil. Sus reseñas se mantienen salvo fraude.</span>
                <button type="submit" className="h-11 self-start rounded-xl border-2 border-ladrillo bg-white px-4 text-sm font-bold text-ladrillo-oscuro">Aplicar</button>
              </form>
              <form action={restablecerDosFactor}>
                <input type="hidden" name="usuarioId" value={elegido.id} />
                <button type="submit" className="h-11 rounded-xl border-[1.5px] border-borde-campo bg-white px-4 text-sm font-semibold">Restablecer 2FA</button>
              </form>
            </div>

            <form action={eliminarUsuario} className="flex flex-col gap-3 rounded-[20px] border border-[#F0C9BE] bg-white p-[22px]">
              <input type="hidden" name="usuarioId" value={elegido.id} />
              <h2 className="font-display text-xl font-bold">Eliminar cuenta</h2>
              <p className="text-[13px] leading-[1.45] text-gris">
                Si no tiene historial (contactos, reseñas, reportes, perfil enviado a revisión), se borra del todo con sus archivos.
                Si lo tiene, se bloquea: no puede ingresar, se oculta su perfil, sus reseñas quedan anónimas y los datos se conservan bloqueados (CU-27). No se puede deshacer.
              </p>
              <label htmlFor="motivo-eliminar" className="text-sm font-semibold">Motivo (opcional)</label>
              <input id="motivo-eliminar" name="motivo" placeholder="Ej: la persona pidió borrar su cuenta" className={campoAdmin} />
              <label htmlFor="confirmacion-eliminar" className="text-sm font-semibold">Para confirmar, escribe <b>{elegido.correo}</b></label>
              <input id="confirmacion-eliminar" name="confirmacion" required autoComplete="off" className={campoAdmin} />
              <button type="submit" className="h-11 self-start rounded-xl bg-ladrillo px-4 text-sm font-bold text-white">Eliminar cuenta</button>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
