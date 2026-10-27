/**
 * Backoffice (B1–B8). Requiere rol verificador, moderador o admin y 2FA.
 * Pendiente: proteger con la sesión de Better Auth y comprobar usuario_roles en el servidor.
 */
export const metadata = { title: "Backoffice", robots: { index: false } };

export default function Admin() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold">Backoffice</h1>
      <p className="mt-2 text-tinta-2">Cola de aprobación, moderación, reclamos y auditoría.</p>
    </main>
  );
}
