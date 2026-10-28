/**
 * P4 / CU-05 · Registra el clic a WhatsApp y redirige a wa.me.
 * compradorId nulo = visitante anónimo (anonimoId).
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";
import { enlaceWhatsApp } from "@las3b/shared";

const { contactos, proveedores, categorias, localidades } = schema;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  let compradorId: string | null = null;
  let anonimoId: string | null = null;

  if (session?.user) {
    compradorId = session.user.id;
  } else {
    anonimoId = crypto.randomUUID();
  }

  const body = await req.json();
  const { proveedorId, categoriaId, localidadId, origen } = body;

  if (!proveedorId || !categoriaId || !localidadId || !origen) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const [proveedor] = await db
    .select({ whatsapp: proveedores.whatsapp })
    .from(proveedores)
    .where(eq(proveedores.id, proveedorId))
    .limit(1);

  if (!proveedor) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  const [categoria] = await db
    .select({ nombre: categorias.nombre })
    .from(categorias)
    .where(eq(categorias.id, categoriaId))
    .limit(1);

  const [localidad] = await db
    .select({ nombre: localidades.nombre })
    .from(localidades)
    .where(eq(localidades.id, localidadId))
    .limit(1);

  await db.insert(contactos).values({
    proveedorId,
    compradorId,
    anonimoId,
    categoriaId,
    localidadId,
    origen,
  });

  const enlace = enlaceWhatsApp(
    proveedor.whatsapp,
    categoria?.nombre ?? "",
    localidad?.nombre ?? ""
  );

  const response = NextResponse.redirect(enlace, 302);

  if (anonimoId) {
    response.cookies.set("anonimo_id", anonimoId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}
