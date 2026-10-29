"use server";

/** Solicitud de retiro de contenido (Ley 1915 de 2018 y términos de uso). Se guarda en `reportes` para que el equipo la revise. */
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@las3b/db";

const esquema = z.object({
  enlace: z.string().trim().url("Pega el enlace completo del contenido.").max(500),
  tipo: z.enum(["foto", "perfil", "servicio", "resena", "respuesta"]),
  motivo: z.enum(["derechos_de_autor", "datos_personales", "suplantacion", "menores", "otro"]),
  descripcion: z.string().trim().min(20, "Cuéntanos con más detalle qué ocurre (mínimo 20 caracteres).").max(2000),
  nombre: z.string().trim().min(3, "Escribe tu nombre.").max(120),
  correo: z.string().trim().email("Revisa el correo."),
  buenaFe: z.literal("on", { message: "Debes declarar que actúas de buena fe." }),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export async function solicitarRetiro(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  if (!r.success) redirect(`/retiro-de-contenido?${new URLSearchParams({ error: r.error.issues[0]?.message ?? "Revisa los datos." })}#formulario`);

  const d = r.data;
  await db.insert(schema.reportes).values({
    tipoObjeto: d.tipo,
    objetoId: d.enlace,
    motivo: `retiro:${d.motivo}`,
    detalle: `${d.descripcion}\n\nReclamante: ${d.nombre} <${d.correo}>\nDeclara buena fe: sí`,
  });
  redirect("/retiro-de-contenido?enviado=1#formulario");
}
