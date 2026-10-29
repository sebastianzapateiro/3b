"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { contactoSinResena, crearResena, proveedorPorSlug } from "@/lib/resenas";

const nota = z.coerce.number().int().min(1, "Califica los cuatro criterios.").max(5);
const esquema = z.object({
  slug: z.string().min(3),
  puntualidad: nota,
  calidad: nota,
  calidadPrecio: nota,
  cumplimiento: nota,
  comentario: z.string().trim().max(500, "El comentario admite hasta 500 caracteres.").optional(),
});

/** CU-20: crea la reseña si la persona contactó al proveedor y aún no la ha calificado. */
export async function calificarProveedor(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  const slug = String(formData.get("slug") ?? "");
  const volver = (error: string): never => redirect(`/${slug}/calificar?${new URLSearchParams({ error })}`);
  if (!r.success) return volver(r.error.issues[0]?.message ?? "Revisa los datos.");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/ingreso?${new URLSearchParams({ destino: `/${slug}/calificar` })}`);

  const proveedor = await proveedorPorSlug(r.data.slug);
  if (!proveedor) return volver("Este proveedor no está disponible.");
  if (proveedor.usuarioId === session.user.id) return volver("No puedes calificar tu propio perfil.");

  const anonimoId = (await cookies()).get("anonimo_id")?.value ?? null;
  const contacto = await contactoSinResena(proveedor.id, session.user.id, anonimoId);
  if (!contacto) return volver("Solo puedes calificar a quien contactaste desde LasTresB, una vez por contacto.");

  await crearResena({
    contactoId: contacto.id,
    proveedorId: proveedor.id,
    compradorId: session.user.id,
    notas: { puntualidad: r.data.puntualidad, calidad: r.data.calidad, calidadPrecio: r.data.calidadPrecio, cumplimiento: r.data.cumplimiento },
    comentario: r.data.comentario || null,
  });

  revalidatePath(`/${proveedor.slug}`);
  redirect(`/${proveedor.slug}/calificar?gracias=1`);
}
