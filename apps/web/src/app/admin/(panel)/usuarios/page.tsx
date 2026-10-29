import Link from "next/link";
import { crearUsuario, guardarRoles, restablecerDosFactor, suspenderUsuario } from "@/app/admin/actions";
import { Aviso, botonOscuro, campoAdmin, Chip, Encabezado, etiquetaAdmin, tarjeta } from "@/components/admin/Ui";
import { listarUsuarios } from "@/lib/admin";
import { exigirBackoffice } from "@/lib/verificacion";
import { MOTIVO_SERVICIOS_NO_PERMITIDOS } from "@las3b/shared";

/** B4 · Usuarios: crear, roles y suspensión (CU-70 a CU-72). Solo administradores. Mockup: docs/mockups/BO_Usuarios.dc.html. */
const ROLES = [
  { v: "comprador", t: "Comprador" },
  { v: "proveedor", t: "Proveedor" },
  { v: "verificador", t: "Verificador" },
  { v: "moderador", t: "Moderador" },
  { v: "admin", t: "Admin" },
];
const TONO_ROL: Record<string, "gris" | "verde" | "amarillo" | "rojo"> = { comprador: "gris", proveedor: "verde", verificador: "amarillo", moderador: "rojo", admin: "amarillo" };
const fecha = (d: Date | null) => (d ? new Date(d).toLocaleDateString("es-CO", { dateStyle: "medium" }) : "—");

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await exigirBackoffice(true);
  const sp = await searchParams;
  const lista = await listarUsuarios(sp.q);
  const creando = sp.nuevo === "1";
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
        <section className={`${tarjeta} min-w-0 flex-[3_1_520px] overflow-x-auto`}>
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="bg-crema text-left text-gris">
                <th className="px-[18px] py-3 font-semibold">Usuario</th><th className="p-3 font-semibold">Roles</th><th className="p-3 font-semibold">Estado</th><th className="p-3 font-semibold">Último ingreso</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={4} className="px-[18px] py-8 text-center text-gris">No hay usuarios con ese criterio.</td></tr>}
              {lista.map((u) => {
                const suspendido = u.suspendidoHasta && new Date(u.suspendidoHasta) > new Date();
                return (
                  <tr key={u.id} className={`border-t border-borde-suave ${u.id === elegido?.id ? "bg-piedra" : ""}`}>
                    <td className="px-[18px] py-3.5">
                      <Link href={`/admin/usuarios?u=${u.id}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} className="flex flex-col">
                        <b>{u.nombre}</b><span className="text-gris">{u.correo}</span>
                      </Link>
                    </td>
                    <td className="p-3.5"><span className="flex flex-wrap gap-1">{u.roles.length ? u.roles.map((r) => <Chip key={r} tono={TONO_ROL[r] ?? "gris"}>{ROLES.find((x) => x.v === r)?.t ?? r}</Chip>) : <Chip tono="gris">Sin rol</Chip>}</span></td>
                    <td className="p-3.5">{suspendido ? <span className="font-semibold text-ladrillo-oscuro">Suspendido hasta {fecha(u.suspendidoHasta)}</span> : <span className="font-semibold text-verde-oscuro">Activo{u.dosFactor ? " · 2FA" : ""}</span>}</td>
                    <td className="p-3.5 text-gris">{fecha(u.ultimoIngreso)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

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
              <span className="text-[13px] leading-[1.45] text-gris">Le enviamos un correo para que elija su clave. Al entrar por primera vez acepta las políticas; los roles de backoffice además le piden activar 2FA.</span>
              <div className="flex gap-2">
                <button type="submit" className={botonOscuro}>Crear y enviar invitación</button>
                <Link href="/admin/usuarios" className="inline-flex h-11 items-center px-3 text-sm font-semibold text-gris">Cancelar</Link>
              </div>
            </form>
          </section>
        )}

        {elegido && (
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
              <span className="text-[13px] leading-[1.45] text-gris">Los roles de backoffice exigen 2FA activo para entrar. El último Admin no puede quitarse el rol.</span>
              <button type="submit" className="h-[42px] self-start rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Guardar roles</button>
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
          </section>
        )}
      </main>
    </>
  );
}
