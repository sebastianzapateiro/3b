import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { verificarSesionAdmin } from "@/lib/verificacion";
import { FormIngresoAdmin } from "./FormIngresoAdmin";

export const metadata = { title: "Ingreso al backoffice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** B1 · Ingreso al backoffice con segundo factor. Mockup: docs/mockups/BO_Ingreso.dc.html. */
export default async function IngresoAdmin() {
  const v = await verificarSesionAdmin();
  if (!v.error) redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-wrap bg-[#F3EFE7]">
      <section className="flex min-w-0 flex-[1_1_440px] flex-col gap-8 bg-tinta px-8 py-10 text-crema lg:px-14">
        <span className="flex items-center gap-2.5 text-crema">
          <Logo oscuro />
          <span className="ml-1.5 flex h-[26px] items-center rounded-full bg-white/12 px-2.5 text-[13px] font-semibold">Backoffice</span>
        </span>
        <div className="my-auto flex max-w-[460px] flex-col gap-5">
          <h2 className="font-display text-[40px] font-extrabold leading-[1.08] tracking-[-1px]">Acceso del equipo Las 3B</h2>
          <p className="text-base leading-relaxed text-[#C9D1CF]">Aquí se revisan documentos de identidad y datos personales. Por eso el ingreso exige segundo factor y cada acción queda registrada en la auditoría.</p>
          <ul className="flex flex-col gap-3 text-[15px] text-[#DDE3E1]">
            <li className="flex items-center gap-2.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3FB394" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Sesión separada de la cuenta pública</li>
            <li className="flex items-center gap-2.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5B700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /></svg>Código de app autenticadora (TOTP) obligatorio</li>
            <li className="flex items-center gap-2.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4694B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>Accesos a documentos auditados</li>
          </ul>
        </div>
        <span className="text-[13px] text-[#A9B4B1]">¿Perdiste tu celular? Pide a un administrador que restablezca tu 2FA.</span>
      </section>
      <section className="flex min-w-0 flex-[1_1_520px] items-center justify-center px-6 py-10">
        <FormIngresoAdmin />
      </section>
    </div>
  );
}
