"use server";

/** B1 · «Ver como» proveedor: el administrador abre el panel de un proveedor en solo lectura. Cada inicio queda en `auditoria`. */
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { auditar } from "@/lib/auditoria";
import { COOKIE_VER_COMO } from "@/lib/panel";
import { exigirBackoffice } from "@/lib/verificacion";

const HORAS = 2;

export async function verComoProveedor(formData: FormData) {
  const actor = await exigirBackoffice(true);
  const id = z.string().uuid().parse(formData.get("id"));
  const [p] = await db.select({ id: schema.proveedores.id }).from(schema.proveedores).where(eq(schema.proveedores.id, id)).limit(1);
  if (!p) redirect("/admin/ver-como");
  // `secure` solo con https: en http://localhost un navegador puede descartar la cookie y la vista no abriría.
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE_VER_COMO, id, { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: HORAS * 3600 });
  await auditar({ actorId: actor.user.id, rol: actor.rol, accion: "ver_como_proveedor", objetoTipo: "proveedor", objetoId: id });
  redirect("/panel");
}

export async function salirDeVerComo() {
  await exigirBackoffice(true);
  (await cookies()).delete(COOKIE_VER_COMO);
  redirect("/admin/ver-como");
}
