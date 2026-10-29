import { SubMenu } from "@/components/SubMenu";
import { exigirUsuario } from "@/lib/cuenta";

export const metadata = { title: "Mi cuenta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** P6 · Mi cuenta. Mockup: docs/mockups/Mi_cuenta.md. */
export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  await exigirUsuario("/cuenta");
  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-5 px-5 pb-14 pt-4 sm:px-6 sm:pt-10">
      <h1 className="font-display text-[32px] font-extrabold tracking-[-1px] sm:text-4xl">Mi cuenta</h1>
      <SubMenu
        etiqueta="Mi cuenta"
        items={[
          { href: "/cuenta", texto: "Mis datos" },
          { href: "/cuenta/actividad", texto: "Contactos y reseñas" },
          { href: "/cuenta/privacidad", texto: "Privacidad" },
        ]}
      />
      {children}
    </main>
  );
}
