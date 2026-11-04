/**
 * Correo de aviso al fundador (lógica pura). Lleva solo lo necesario para actuar (Ley 1581): nada de documentos,
 * RUT, fotos ni números de identificación. El WhatsApp del proveedor va únicamente dentro del enlace «Escribirle».
 */
import { ETIQUETA_EVENTO, type EventoCola } from "./actividad-cola";

export type DatosAviso = {
  proveedorId: string;
  nombre: string;
  whatsapp: string;
  oficios: string[];
  zonas: string[];
  porcentaje: number;
  faltan: string[];
  origen: { source?: string | null; medium?: string | null; campaign?: string | null; content?: string | null; term?: string | null };
  urlAdmin: string;
};

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hora = (d: Date) => d.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" });

/** ID de seguimiento de la hoja de prospección (utm_term, p. ej. P-017); si no hay, el corto interno. */
export const idDeSeguimiento = (d: Pick<DatosAviso, "proveedorId" | "origen">) => d.origen.term?.trim() || d.proveedorId.slice(0, 8);

export function armarCorreo(d: DatosAviso, eventos: EventoCola[], ahora = new Date()) {
  const id = idDeSeguimiento(d);
  const nuevo = eventos.some((e) => e.tipo === "creado");
  const oficio = d.oficios[0] ?? "sin oficio aún";
  const asunto = nuevo ? `LasTresB · Proveedor nuevo: ${oficio} (${id})` : `LasTresB · Cambios en ${d.nombre} (${id})`;

  const campos = [...new Set(eventos.flatMap((e) => e.campos))];
  const tipos = [...new Set(eventos.map((e) => ETIQUETA_EVENTO[e.tipo]))];
  const detalles = [...new Set(eventos.map((e) => e.detalle).filter((x): x is string => Boolean(x)))];
  const fuente = [d.origen.source, d.origen.medium, d.origen.campaign, d.origen.content].filter(Boolean).join(" / ") || "Sin fuente registrada";
  const wa = `https://wa.me/${d.whatsapp.replace(/\D/g, "")}`;
  const filas: [string, string][] = [
    ["Proveedor", d.nombre],
    ["Oficio", d.oficios.join(", ") || "—"],
    ["Zonas", d.zonas.join(", ") || "—"],
    ["Perfil completo", `${d.porcentaje} %`],
    ["Qué pasó", [...tipos, ...detalles].join(" · ")],
    ["Campos que cambiaron", campos.join(", ") || "—"],
    ["Campos que faltan", d.faltan.join(", ") || "Ninguno"],
    ["Fuente", fuente],
    ["ID de seguimiento", id],
    ["Hora (Bogotá)", hora(eventos.length ? eventos[eventos.length - 1]!.creadoEn : ahora)],
  ];

  const texto = [
    asunto,
    "",
    ...filas.map(([k, v]) => `${k}: ${v}`),
    "",
    `Abrir en el backoffice: ${d.urlAdmin}`,
    ...(d.whatsapp ? [`Escribirle por WhatsApp: ${wa}`] : []),
    "",
    "Aviso interno de LasTresB. Los documentos y fotos solo se ven dentro del backoffice.",
  ].join("\n");

  const boton = (href: string, t: string, fondo: string) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;margin:4px 8px 4px 0;border-radius:10px;background:${fondo};color:#fff;font-weight:600;text-decoration:none">${esc(t)}</a>`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f6f1e7;font-family:Arial,Helvetica,sans-serif;color:#1b2623">
<div style="max-width:560px;margin:0 auto;padding:20px">
<h1 style="font-size:20px;margin:0 0 12px">${esc(nuevo ? "Proveedor nuevo" : "Cambios en un proveedor")}</h1>
<table role="presentation" style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px">
${filas.map(([k, v]) => `<tr><td style="padding:8px 12px;color:#6b7370;font-size:13px;vertical-align:top;width:40%">${esc(k)}</td><td style="padding:8px 12px;font-size:15px">${esc(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:16px 0">${boton(d.urlAdmin, "Abrir en el backoffice", "#1b2623")}${d.whatsapp ? boton(wa, "Escribirle por WhatsApp", "#0f6b5c") : ""}</p>
<p style="font-size:12px;color:#6b7370">Aviso interno de LasTresB. Los documentos y fotos solo se ven dentro del backoffice.</p>
</div></body></html>`;

  return { asunto, texto, html };
}
