import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appleHabilitado, auth, googleHabilitado } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { meta } from "@/lib/seo";
import { IngresoClient } from "./IngresoClient";

/** A0 · Único ingreso del sitio: el usuario dice si es cliente o proveedor y la visual se ajusta. */
/** Es el enlace que se comparte en grupos de WhatsApp: lleva título, descripción e imagen de vista previa (Open Graph). Sin indexar. */
export const metadata = meta({
  titulo: "Inscríbete gratis en LasTresB",
  descripcion: "Date a conocer en Bogotá sin costo ni comisión: los clientes te contactan directo por WhatsApp. Crea tu perfil o busca servicios de confianza.",
  ruta: "/ingreso",
  noindex: true,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Ingreso({ searchParams }: Props) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  // Con sesión iniciada no se pregunta de nuevo: se sigue al destino.
  // Si la base no responde (p. ej. en local sin el túnel) se trata como «sin sesión» y se muestra el ingreso.
  const sesion = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (sesion?.user) redirect(destino);

  const aviso = params.verificado === "1" ? "verificado" : params.clave === "nueva" ? "clave" : params.error === "INVALID_TOKEN" ? "enlace" : params.error === "oauth" ? "oauth" : null;
  return <IngresoClient destino={destino} google={googleHabilitado} apple={appleHabilitado} aviso={aviso} />;
}
