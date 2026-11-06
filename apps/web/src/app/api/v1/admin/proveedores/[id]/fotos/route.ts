/**
 * B1 · Confirma una foto de trabajo que el equipo subió a nombre de un proveedor: valida el tipo real, la convierte a WebP
 * (sin EXIF ni GPS) y la publica en su portafolio. POST { camino, declaraAutoria, descripcion? }. Cada carga queda en `auditoria` (regla 3).
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { confirmarFoto } from "@/lib/fotos";
import { verificarSesionAdmin } from "@/lib/verificacion";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const cuerpo = z.object({ camino: z.string().max(200), declaraAutoria: z.boolean(), descripcion: z.string().max(140).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verificarSesionAdmin();
  if (v.error || !v.user || !v.rol) return NextResponse.json({ error: "Sin acceso al backoffice" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Proveedor no válido" }, { status: 400 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = await confirmarFoto(id, datos.data);
  if ("error" in r) return NextResponse.json(r, { status: 422 });
  await auditar({ actorId: v.user.id, rol: v.rol, accion: "foto_cargada_equipo", objetoTipo: "proveedor", objetoId: id, metadatos: { fotoId: r.id } });
  const [p] = await db.select({ slug: schema.proveedores.slug }).from(schema.proveedores).where(eq(schema.proveedores.id, id)).limit(1);
  if (p) revalidatePath(`/${p.slug}`);
  return NextResponse.json(r, { status: 201 });
}
