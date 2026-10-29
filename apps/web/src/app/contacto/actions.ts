"use server";

/** Formulario de /contacto: guarda el mensaje para que el equipo lo atienda desde el backoffice. */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@las3b/db";
import { ipDeLaPeticion } from "@/lib/consentimientos";
import { MOTIVOS_CONTACTO } from "@/lib/contacto";
import { excedeLimite } from "@/lib/limite";

const esquema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  correo: z.string().trim().email("Revisa tu correo."),
  motivo: z.enum(MOTIVOS_CONTACTO),
  mensaje: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(3000),
  autoriza: z.literal("on", { message: "Debes autorizar el uso de tus datos para poder responderte." }),
  web: z.string().max(0).optional(), // campo trampa contra robots
});

export async function enviarMensaje(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  const volver = (error: string): never => redirect(`/contacto?${new URLSearchParams({ error })}#formulario`);
  if (!r.success) return volver(r.error.issues[0]?.message ?? "Revisa los datos.");
  if (excedeLimite(ipDeLaPeticion(await headers()))) return volver("Enviaste varios mensajes seguidos. Intenta de nuevo en un rato.");

  const d = r.data;
  await db.insert(schema.mensajesContacto).values({ nombre: d.nombre, correo: d.correo, motivo: d.motivo, mensaje: d.mensaje, autorizaDatos: true });
  redirect("/contacto?enviado=1#formulario");
}