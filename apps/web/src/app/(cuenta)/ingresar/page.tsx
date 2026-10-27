import Link from "next/link";
import { BannerProveedor, BotonGoogle, Encabezado, Separador, Aviso } from "@/components/cuenta";
import { googleHabilitado } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { FormIngresar } from "./FormIngresar";

/** P1 · Ingresar (RF-14, RF-16). Mockup: Login_movil. */
export const metadata = { title: "Ingresar" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Ingresar({ searchParams }: Props) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  const conDestino = destino === "/" ? "" : `?destino=${encodeURIComponent(destino)}`;

  return (
    <>
      <Encabezado titulo="Hola de nuevo" texto="Ingresa para calificar a quienes contactaste o gestionar tu página de proveedor." />

      <div className="mt-7 flex flex-col gap-2.5 empty:hidden">
        {params.verificado === "1" && <Aviso tono="exito">Tu correo quedó confirmado. Ya puedes ingresar.</Aviso>}
        {params.clave === "nueva" && <Aviso tono="exito">Listo, cambiaste tu clave. Ingresa con la nueva.</Aviso>}
        {params.error === "INVALID_TOKEN" && <Aviso tono="error">El enlace venció o ya se usó. Ingresa y te enviamos uno nuevo.</Aviso>}
        {googleHabilitado && <BotonGoogle destino={destino} />}
      </div>

      {googleHabilitado && <Separador />}
      <div className={googleHabilitado ? "" : "mt-7"}>
        <FormIngresar destino={destino} />
      </div>

      <p className="mt-5 text-center text-[15px] text-tinta-2">
        ¿No tienes cuenta?{" "}
        <Link href={`/registro${conDestino}`} className="font-semibold text-verde hover:text-verde-oscuro">
          Crear cuenta
        </Link>
      </p>

      <BannerProveedor />
    </>
  );
}
