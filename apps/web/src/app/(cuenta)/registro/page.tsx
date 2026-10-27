import Link from "next/link";
import { BotonGoogle, Encabezado, Separador } from "@/components/cuenta";
import { googleHabilitado } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { FormRegistro } from "./FormRegistro";

/** P1 · Crear cuenta de comprador (RF-14, RF-16, RF-19, CU-07). */
export const metadata = { title: "Crear cuenta" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Registro({ searchParams }: Props) {
  const destino = destinoSeguro((await searchParams).destino);

  return (
    <>
      <Encabezado titulo="Crea tu cuenta" texto="Es gratis. La necesitas para calificar a quienes contactaste por Las 3B." />

      {googleHabilitado && (
        <>
          <div className="mt-7 flex flex-col gap-2.5">
            <BotonGoogle destino={destino} />
          </div>
          <Separador />
        </>
      )}
      <div className={googleHabilitado ? "" : "mt-7"}>
        <FormRegistro />
      </div>

      <p className="mb-2 mt-5 text-center text-[15px] text-tinta-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-verde hover:text-verde-oscuro">
          Ingresar
        </Link>
      </p>
    </>
  );
}
