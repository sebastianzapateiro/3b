"use server";

/**
 * P2 · Demanda sin cubrir (solicitudes_servicio): quien no encuentra un servicio deja su pedido y, si quiere, su WhatsApp.
 * El WhatsApp es dato personal: solo se guarda con la casilla de autorización marcada.
 */
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { contieneServicioProhibido } from "@las3b/shared";
import { db, schema } from "@las3b/db";
import { headers } from "next/headers";
import { ipDeLaPeticion } from "@/lib/consentimientos";
import { destinoSeguro } from "@/lib/destino";

/** Antispam: máximo 5 solicitudes por IP cada hora (en memoria; protege cada instancia del servidor). */
const ENVIOS = new Map<string, number[]>();
function demasiadas(ip: string | null) {
  if (!ip) return false;
  const ahora = Date.now();
  const recientes = (ENVIOS.get(ip) ?? []).filter((t) => ahora - t < 3_600_000);
  recientes.push(ahora);
  ENVIOS.set(ip, recientes);
  return recientes.length > 5;
}

const esquema = z.object({
  oficio: z.string().trim().max(80).optional(),
  texto: z.string().trim().max(300).optional(),
  localidad: z.string().trim().max(60).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  autoriza: z.string().optional(),
  web: z.string().max(0).optional(), // campo trampa contra robots
  retorno: z.string().optional(),
});

export async function registrarSolicitud(formData: FormData) {
  const r = esquema.safeParse(Object.fromEntries(formData));
  const retorno = destinoSeguro(r.success ? r.data.retorno : "/categorias");
  const volver = (params: Record<string, string>): never => redirect(`${retorno.split("#")[0]}?${new URLSearchParams(params)}#demanda`);
  if (!r.success) return volver({ error: "Revisa los datos e intenta de nuevo." });

  const d = r.data;
  if (demasiadas(ipDeLaPeticion(await headers()))) return volver({ error: "Hiciste varias solicitudes seguidas. Intenta de nuevo en un rato." });
  if (!d.oficio && !d.texto) return volver({ error: "Cuéntanos qué servicio buscas." });

  const whatsapp = d.whatsapp?.replace(/[^\d+]/g, "") || null;
  if (whatsapp && !/^\+?\d{10,13}$/.test(whatsapp)) return volver({ error: "Revisa el número de WhatsApp." });
  if (whatsapp && d.autoriza !== "on") return volver({ error: "Para avisarte por WhatsApp necesitamos tu autorización." });

  const [loc] = d.localidad ? await db.select({ id: schema.localidades.id }).from(schema.localidades).where(eq(schema.localidades.slug, d.localidad)).limit(1) : [];

  await db.insert(schema.solicitudesServicio).values({
    oficioSlug: d.oficio || null,
    textoLibre: d.texto || null,
    localidadId: loc?.id ?? null,
    whatsapp,
    autorizaDatos: Boolean(whatsapp) && d.autoriza === "on",
    // Si pide un servicio que LasTresB no ofrece, se guarda pero no cuenta como demanda a cubrir.
    cuentaComoDemanda: !contieneServicioProhibido(`${d.oficio ?? ""} ${d.texto ?? ""}`),
  });

  return volver({ solicitud: "1" });
}
