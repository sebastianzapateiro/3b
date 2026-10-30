/**
 * P4 / CU-05 · Registra el clic a WhatsApp y redirige a wa.me.
 * GET /api/v1/contactos/ir?p=<slug>&origen=perfil|busqueda|qr|redes[&s=<id de la solicitud>]
 * Cada clic queda en `contactos`: es la base para que el comprador pueda calificar (regla 4).
 * compradorId nulo = visitante anónimo (cookie anonimo_id).
 */
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { enlaceConMensaje, enlaceWhatsApp, mensajeSolicitud } from "@las3b/shared";
import { auth } from "@/lib/auth";
import { COOKIE_SOLICITUD, obtenerSolicitud } from "@/lib/solicitudes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

const ORIGENES = ["perfil", "busqueda", "qr", "redes", "banner"];
const ES_ROBOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp/i;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("p") ?? "";
  const origen = ORIGENES.includes(url.searchParams.get("origen") ?? "") ? url.searchParams.get("origen")! : "perfil";

  const [p] = await db
    .select({ id: schema.proveedores.id, nombre: schema.proveedores.nombrePublico, whatsapp: schema.proveedores.whatsapp, estado: schema.proveedores.estado })
    .from(schema.proveedores)
    .where(eq(schema.proveedores.slug, slug))
    .limit(1);
  if (!p || (p.estado !== "aprobado" && p.estado !== "en_revision")) return NextResponse.redirect(new URL("/", req.url));

  const [cat] = await db
    .select({ id: schema.categorias.id, nombre: schema.categorias.nombre })
    .from(schema.proveedorCategorias)
    .innerJoin(schema.categorias, eq(schema.categorias.id, schema.proveedorCategorias.categoriaId))
    .where(eq(schema.proveedorCategorias.proveedorId, p.id))
    .limit(1);
  const [loc] = await db
    .select({ id: schema.localidades.id, nombre: schema.localidades.nombre })
    .from(schema.proveedorLocalidades)
    .innerJoin(schema.localidades, eq(schema.localidades.id, schema.proveedorLocalidades.localidadId))
    .where(eq(schema.proveedorLocalidades.proveedorId, p.id))
    .limit(1);

  // Si el comprador llenó «¿Qué estás buscando?» (parámetro `s` o cookie), el chat empieza con su solicitud tal cual.
  const jar0 = await cookies();
  const solicitudId = url.searchParams.get("s") ?? jar0.get(COOKIE_SOLICITUD)?.value ?? null;
  const solicitud = solicitudId && UUID.test(solicitudId) ? await obtenerSolicitud(solicitudId) : null;
  const mensaje = solicitud ? mensajeSolicitud({ proveedor: p.nombre, cliente: solicitud.nombre ?? "un vecino", categoria: solicitud.categoria ?? cat?.nombre ?? null, lugar: solicitud.lugar, solicitud: solicitud.texto }) : null;
  const destino = mensaje ? enlaceConMensaje(p.whatsapp, mensaje) : enlaceWhatsApp(p.whatsapp, cat?.nombre ?? "un servicio", loc?.nombre ?? "Bogotá");
  const respuesta = NextResponse.redirect(destino, 302);

  const h = await headers();
  if (ES_ROBOT.test(h.get("user-agent") ?? "")) return respuesta;

  const session = await auth.api.getSession({ headers: h });
  const jar = await cookies();
  let anonimoId = jar.get("anonimo_id")?.value ?? null;

  if (!session?.user && !anonimoId) {
    anonimoId = crypto.randomUUID();
    respuesta.cookies.set("anonimo_id", anonimoId, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax" });
  }

  await db.insert(schema.contactos).values({
    proveedorId: p.id,
    compradorId: session?.user?.id ?? null,
    anonimoId: session?.user ? null : anonimoId,
    categoriaId: cat?.id ?? null,
    localidadId: loc?.id ?? null,
    origen,
    solicitudId: solicitud?.id ?? null,
    mensaje,
  });

  return respuesta;
}
