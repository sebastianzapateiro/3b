import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appleHabilitado, auth, googleHabilitado } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { IngresoClient } from "./IngresoClient";

/** A0 · Único ingreso del sitio: el usuario dice si es cliente o proveedor y la visual se ajusta. */
export const metadata = { title: "Ingresar", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Ingreso({ searchParams }: Props) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  // Con sesión iniciada no se pregunta de nuevo: se sigue al destino.
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (sesion?.user) redirect(destino);

  const aviso = params.verificado === "1" ? "verificado" : params.clave === "nueva" ? "clave" : params.error === "INVALID_TOKEN" ? "enlace" : params.error === "oauth" ? "oauth" : null;
  return <IngresoClient destino={destino} google={googleHabilitado} apple={appleHabilitado} aviso={aviso} />;
}
