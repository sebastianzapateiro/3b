import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appleHabilitado, auth, googleHabilitado } from "@/lib/auth";
import { destinoSeguro } from "@/lib/destino";
import { TODAS_LAS_SUBCATEGORIAS } from "@las3b/shared";
import { meta } from "@/lib/seo";
import { IngresoClient } from "./IngresoClient";

/** A0 · Único ingreso del sitio. El registro es solo para proveedores; el de cliente aparece únicamente si llega a calificar un servicio. */
/** Es el enlace que se comparte en grupos de WhatsApp: lleva título, descripción e imagen de vista previa (Open Graph). Sin indexar. */
export const metadata = meta({
  titulo: "Inscríbete gratis en LasTresB",
  descripcion: "Date a conocer en Bogotá sin costo ni comisión: los clientes te contactan directo por WhatsApp. Crea tu perfil y empieza a recibir clientes.",
  ruta: "/ingreso",
  noindex: true,
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Quien viene a calificar un servicio necesita cuenta de cliente: es la única entrada del cliente al registro. */
const ES_CALIFICAR = /\/calificar(\?|$)/;

export default async function Ingreso({ searchParams }: Props) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  // Con sesión iniciada no se pregunta de nuevo: se sigue al destino.
  // Si la base no responde (p. ej. en local sin el túnel) se trata como «sin sesión» y se muestra el ingreso.
  const sesion = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (sesion?.user) redirect(destino);

  // Los oficios salen del catálogo (no de la base): el menú se muestra completo aunque la base no responda. El servidor valida que estén activos.
  const oficios = TODAS_LAS_SUBCATEGORIAS.map(({ sub, padre }) => ({ id: sub.slug, slug: sub.slug, nombre: sub.nombre, grupo: padre.nombre }));
  const aviso = params.verificado === "1" ? "verificado" : params.clave === "nueva" ? "clave" : params.error === "INVALID_TOKEN" ? "enlace" : params.error === "oauth" ? "oauth" : null;
  return <IngresoClient destino={destino} google={googleHabilitado} apple={appleHabilitado} aviso={aviso} oficios={oficios} tipo={ES_CALIFICAR.test(destino) ? "cliente" : "proveedor"} />;
}
