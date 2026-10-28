import { buscarPendientes } from "@/lib/admin";
import { verificarSesionAdmin } from "@/lib/verificacion";
import { Encabezado, Aviso } from "@/components/cuenta";

export const metadata = { title: "Backoffice", robots: { index: false } };

/** B1 · Backoffice: cola de aprobación con protección de sesión + rol + 2FA. */
export default async function Admin() {
  const verif = await verificarSesionAdmin();
  const error = verif.error;

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16">
        <Encabezado titulo="Backoffice" texto="Acceso restringido." />
        <Aviso tono="error">{error}. Debes tener rol de verificador, moderador o admin y 2FA habilitado.</Aviso>
        <p className="mt-4 text-sm text-gris">
          <a className="font-semibold text-verde hover:text-verde-oscuro" href="/ingresar">
            Ir a ingresar
          </a>
        </p>
      </main>
    );
  }

  const pendientes = await buscarPendientes();

  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <Encabezado
        titulo="Backoffice"
        texto="Cola de aprobación, moderación, reclamos y auditoría."
      />
      <div className="mt-6 flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">Solicitudes pendientes</h2>
        {pendientes.length === 0 ? (
          <p className="text-tinta-2">No hay proveedores pendientes de revisión.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendientes.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-2xl border border-borde-suave bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <b className="text-lg text-tinta">{p.nombrePublico}</b>
                  <span className="text-sm text-gris">
                    {p.slug} · {p.segmento} · WhatsApp: {p.whatsapp}
                  </span>
                  {p.categoriaNombre && <span className="text-sm text-tinta-2">Categoría: {p.categoriaNombre}</span>}
                </div>
                <div className="flex gap-2">
                  <form method="post" action="/api/v1/admin/aprobar">
                    <input type="hidden" name="proveedorId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-campo bg-verde px-4 py-2 text-sm font-semibold text-white"
                    >
                      Aprobar
                    </button>
                  </form>
                  <form method="post" action="/api/v1/admin/rechazar">
                    <input type="hidden" name="proveedorId" value={p.id} />
                    <input name="motivo" type="text" placeholder="Motivo (opcional)" className="rounded-campo border border-borde px-3 py-2 text-sm" />
                    <button
                      type="submit"
                      className="rounded-campo bg-ladrillo px-4 py-2 text-sm font-semibold text-white"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
