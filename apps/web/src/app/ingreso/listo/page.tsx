import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { leerTipo, tieneConsentimiento, tieneProveedor } from "@/lib/ingreso";
import { cancelarCuenta, confirmarCuenta } from "../actions";

/**
 * A0 · Después de ingresar: confirma la cuenta nueva (Google/Apple), ofrece activar el otro perfil o sigue al destino.
 * Toda la decisión se toma en el servidor con la sesión y la cookie del tipo elegido.
 */
export const metadata = { title: "Confirmar cuenta", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const tarjeta = "mx-auto flex w-full max-w-[460px] flex-col gap-5 rounded-[24px] border border-borde-suave bg-white p-6 sm:p-8";
const botonPrincipal = "flex h-[54px] w-full items-center justify-center rounded-campo bg-tinta text-[17px] font-semibold text-white";
const botonSecundario = "flex h-[54px] w-full items-center justify-center rounded-campo border-[1.5px] border-borde-campo text-[17px] font-semibold text-tinta";

export default async function Listo({ searchParams }: Props) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion?.user) redirect("/ingreso");

  const tipo = await leerTipo();
  const { name, email, image, id } = sesion.user;

  if (!(await tieneConsentimiento(id))) {
    const proveedor = tipo === "proveedor";
    return (
      <main className="flex min-h-[calc(100dvh-4.5rem)] items-center px-4 py-10">
        <form action={confirmarCuenta} className={tarjeta}>
          <input type="hidden" name="destino" value={destino} />
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.6px]">
            No encontramos una cuenta con este correo
          </h1>
          <p className="text-base leading-normal text-tinta-2">
            ¿Quieres crear tu cuenta de {proveedor ? "proveedor" : "cliente"} con estos datos?
          </p>
          <div className="flex items-center gap-3.5 rounded-[18px] bg-piedra p-4">
            {image ? (
              <Image src={image} alt="" width={56} height={56} unoptimized className="size-14 flex-none rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-14 flex-none items-center justify-center rounded-full bg-verde-claro font-display text-xl font-bold text-verde-oscuro">{name.slice(0, 1).toUpperCase()}</span>
            )}
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-base">{name}</b>
              <span className="truncate text-sm text-tinta-2">{email}</span>
            </span>
          </div>
          {/* RF-19 / Ley 1581: casilla sin marcar; los datos solo se usan para crear la cuenta. */}
          <label className="flex items-start gap-3 text-[15px] leading-snug">
            <input type="checkbox" name="acepto" required className="mt-0.5 size-5 flex-none accent-verde" />
            <span>
              Soy mayor de edad y acepto los{" "}
              <Link href={proveedor ? "/terminos-proveedores" : "/terminos"} target="_blank" className="font-semibold text-verde underline">
                {proveedor ? "términos para proveedores" : "términos de uso"}
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className="font-semibold text-verde underline">política de tratamiento de datos</Link>.
            </span>
          </label>
          {params.error === "acepto" && <p role="alert" className="rounded-campo bg-ladrillo-suave px-4 py-3 text-[15px] text-ladrillo-oscuro">Marca la casilla para crear tu cuenta.</p>}
          <div className="flex flex-col gap-2.5">
            <button type="submit" className={botonPrincipal}>Sí, crear mi cuenta</button>
            <button type="submit" formAction={cancelarCuenta} formNoValidate className={botonSecundario}>Cancelar</button>
          </div>
        </form>
      </main>
    );
  }

  const esProveedor = await tieneProveedor(id);
  if (tipo === "proveedor") {
    if (esProveedor) redirect("/panel");
    return (
      <main className="flex min-h-[calc(100dvh-4.5rem)] items-center px-4 py-10">
        <div className={tarjeta}>
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.6px]">Activa también tu perfil de proveedor</h1>
          <p className="text-base leading-normal text-tinta-2">
            Tu cuenta de <b>{email}</b> es de cliente. Puedes usar la misma cuenta para ofrecer tus servicios: te pedimos tus datos y el equipo los revisa antes de publicar tu perfil.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link href="/proveedores/registro" className={botonPrincipal}>Sí, activar mi perfil de proveedor</Link>
            <Link href={destino} className={botonSecundario}>No, seguir como cliente</Link>
          </div>
        </div>
      </main>
    );
  }
  redirect(destino);
}
