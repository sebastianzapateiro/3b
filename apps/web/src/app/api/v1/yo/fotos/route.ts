/**
 * P8 · Fotos de trabajos del proveedor con sesión. Web y app móvil.
 * POST { camino, declaraAutoria, descripcion? }: confirma una subida hecha con la URL firmada, procesa y publica la foto.
 */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { eq } from "drizzle-orm";
import { proveedorQueCarga } from "@/lib/documentos";
import { confirmarFoto, confirmarFotoPerfil } from "@/lib/fotos";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const cuerpo = z.object({ camino: z.string().max(200), declaraAutoria: z.boolean(), descripcion: z.string().max(140).optional(), perfil: z.boolean().optional() });

export async function POST(req: Request) {
  const p = await proveedorQueCarga();
  if (!p) return NextResponse.json({ error: "Sin perfil de proveedor" }, { status: 401 });
  const datos = cuerpo.safeParse(await req.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const r = datos.data.perfil ? await confirmarFotoPerfil(p.id, { camino: datos.data.camino, autoriza: datos.data.declaraAutoria }) : await confirmarFoto(p.id, datos.data);
  if ("error" in r) return NextResponse.json(r, { status: 422 });
  const [slug] = await db.select({ slug: schema.proveedores.slug }).from(schema.proveedores).where(eq(schema.proveedores.id, p.id)).limit(1);
  if (slug) revalidatePath(`/${slug.slug}`);
  return NextResponse.json(r, { status: 201 });
}
