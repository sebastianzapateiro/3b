/**
 * P3 / P8 / B1 · Documentos privados del proveedor (RF-17, CU-30, CU-51; reglas 1 y 2).
 * Subida en dos pasos: `prepararSubida` entrega una URL firmada de un solo uso para que el navegador suba
 * directo al bucket `privado` (Vercel no admite cuerpos de más de 4,5 MB); `confirmarSubida` comprueba el
 * tipo real por sus primeros bytes y el tamaño, y solo entonces registra el archivo en `documentos`.
 * Lectura: solo el equipo, con URL firmada (minutos en `configuracion`) y registro en `auditoria`.
 * Para el proveedor (alta y panel), la API /api/v1/yo/documentos y el backoffice.
 */
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { auth } from "@/lib/auth";
import { borrarObjetos, firmarSubida, infoObjeto, leerInicio, urlFirmada } from "@/lib/almacenamiento";
import { auditar } from "@/lib/auditoria";
import { parametro } from "@/lib/parametros";

const { documentos, proveedores, proveedorCategorias, categorias } = schema;

export const TIPOS_DOCUMENTO = ["documento_frente", "documento_reverso", "rut", "camara_comercio", "matricula", "autorizacion_ley_1918"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const NOMBRE_DOCUMENTO: Record<TipoDocumento, string> = {
  documento_frente: "Documento · frente",
  documento_reverso: "Documento · reverso",
  rut: "RUT",
  camara_comercio: "Cámara de comercio",
  matricula: "Matrícula o certificación del oficio",
  autorizacion_ley_1918: "Autorización Ley 1918 firmada",
};

/** Tipos aceptados (deben coincidir con los del bucket `privado`) y su extensión. */
export const MIME_DOCUMENTO = { "image/jpeg": "jpg", "image/png": "png", "image/heic": "heic", "application/pdf": "pdf" } as const;
type MimeDocumento = keyof typeof MIME_DOCUMENTO;

export type Requisito = {
  tipo: TipoDocumento;
  nombre: string;
  /** Lo exige el segmento o la categoría: el equipo lo revisa antes de aprobar. */
  exigido: boolean;
  /** Hay que cargarlo para enviar el alta a revisión. */
  antesDeEnviar: boolean;
  ayuda?: string;
};

/**
 * Documentos por segmento y categoría (docs/02-casos-de-uso.md §Alta). Una sola fuente para el alta,
 * el panel y el backoffice.
 */
export function documentosExigidos(segmento: string | null, cats: { rut: boolean; matricula: boolean; menores: boolean }[]): Requisito[] {
  const r = (tipo: TipoDocumento, exigido: boolean, antesDeEnviar: boolean, ayuda?: string): Requisito => ({ tipo, nombre: NOMBRE_DOCUMENTO[tipo], exigido, antesDeEnviar, ayuda });
  const rutDesdeAlta = segmento === "empresa" || segmento === "independiente_con_rut" || cats.some((c) => c.rut);
  const lista = [
    r("documento_frente", true, true),
    r("documento_reverso", true, true),
    rutDesdeAlta
      ? r("rut", true, true, cats.some((c) => c.rut) ? "Tu categoría lo exige desde el registro." : undefined)
      : r("rut", false, false, "Puedes cargarlo hasta 30 días después de tu aprobación."),
  ];
  if (segmento === "empresa") lista.push(r("camara_comercio", true, true, "Certificado de existencia y representación legal."));
  if (cats.some((c) => c.matricula)) lista.push(r("matricula", true, true, "Certificado vigente de tu oficio."));
  if (cats.some((c) => c.menores)) lista.push(r("autorizacion_ley_1918", true, false, "Solo si prefieres firmar el formato en papel y subirlo escaneado."));
  return lista;
}

/** Proveedor de la sesión que puede cargar documentos (cualquier estado salvo suspendido), o null. */
export async function proveedorQueCarga() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [p] = await db.select({ id: proveedores.id, estado: proveedores.estado }).from(proveedores).where(eq(proveedores.usuarioId, session.user.id)).limit(1);
  return p && p.estado !== "suspendido" ? p : null;
}

/** Requisitos del proveedor según su segmento y sus categorías guardadas. */
export async function requisitosDelProveedor(proveedorId: string) {
  const [[p], cats] = await Promise.all([
    db.select({ segmento: proveedores.segmento }).from(proveedores).where(eq(proveedores.id, proveedorId)).limit(1),
    db
      .select({ rut: categorias.exigeRutDesdeAlta, matricula: categorias.exigeMatricula, menores: categorias.exigeInsigniaMenores })
      .from(proveedorCategorias)
      .innerJoin(categorias, eq(categorias.id, proveedorCategorias.categoriaId))
      .where(eq(proveedorCategorias.proveedorId, proveedorId)),
  ]);
  return documentosExigidos(p?.segmento ?? null, cats);
}

/** Lo que el proveedor ve de sus archivos: nunca la ruta en el bucket. */
export async function documentosCargados(proveedorId: string) {
  return db
    .select({ id: documentos.id, tipo: documentos.tipo, mime: documentos.mime, bytes: documentos.bytes, creado: documentos.createdAt })
    .from(documentos)
    .where(eq(documentos.proveedorId, proveedorId));
}

/** Requisitos con su estado; `faltan` son los que impiden enviar el alta. */
export async function estadoDocumentos(proveedorId: string) {
  const [requisitos, cargados] = await Promise.all([requisitosDelProveedor(proveedorId), documentosCargados(proveedorId)]);
  const lista = requisitos.map((r) => {
    const d = cargados.find((c) => c.tipo === r.tipo);
    return { ...r, cargado: d ? { mime: d.mime, bytes: d.bytes } : null };
  });
  return { lista, faltan: lista.filter((r) => r.antesDeEnviar && !r.cargado).map((r) => r.nombre) };
}

/** Tipo real por la firma de los primeros bytes; no se confía en la extensión ni en lo que declara el navegador. */
export function tipoReal(b: Uint8Array): MimeDocumento | null {
  const hex = (i: number, n: number) => Buffer.from(b.subarray(i, i + n)).toString("hex");
  if (hex(0, 3) === "ffd8ff") return "image/jpeg";
  if (hex(0, 8) === "89504e470d0a1a0a") return "image/png";
  if (hex(0, 4) === "25504446") return "application/pdf"; // %PDF
  const ascii = Buffer.from(b.subarray(4, 12)).toString("latin1");
  if (ascii.startsWith("ftyp") && /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(ascii.slice(4, 8))) return "image/heic";
  return null;
}

const maxBytes = async () => (await parametro("documento_max_mb")) * 1024 * 1024;

type Error = { error: string };

/** Paso 1 de la subida: valida lo declarado y entrega la URL firmada. El camino lo elige el servidor. */
export async function prepararSubida(proveedorId: string, a: { tipo: string; mime: string; bytes: number }): Promise<{ camino: string; url: string } | Error> {
  if (!TIPOS_DOCUMENTO.includes(a.tipo as TipoDocumento)) return { error: "Tipo de documento no válido." };
  const ext = MIME_DOCUMENTO[a.mime as MimeDocumento];
  if (!ext) return { error: "Formato no permitido. Usa JPG, PNG, HEIC o PDF." };
  const max = await maxBytes();
  if (!(a.bytes > 0) || a.bytes > max) return { error: `El archivo debe pesar menos de ${max / 1024 / 1024} MB.` };
  const camino = `proveedores/${proveedorId}/${a.tipo}-${randomUUID()}.${ext}`;
  return { camino, url: await firmarSubida("privado", camino) };
}

/** Paso 2 de la subida: comprueba el archivo ya subido y lo registra. Reemplaza el anterior del mismo tipo. */
export async function confirmarSubida(proveedorId: string, a: { tipo: string; camino: string }) {
  const patron = new RegExp(`^proveedores/${proveedorId}/(${TIPOS_DOCUMENTO.join("|")})-[0-9a-f-]{36}\\.(jpg|png|heic|pdf)$`);
  const m = a.camino.match(patron);
  if (!m || m[1] !== a.tipo) return { error: "La subida no corresponde a tu perfil." } satisfies Error;

  const info = await infoObjeto("privado", a.camino);
  if (!info) return { error: "No recibimos el archivo. Intenta subirlo de nuevo." } satisfies Error;
  const real = tipoReal(await leerInicio("privado", a.camino));
  if (!real || MIME_DOCUMENTO[real] !== m[2] || info.bytes > (await maxBytes())) {
    await borrarObjetos("privado", [a.camino]);
    return { error: "El archivo no es una foto o un PDF válido. Toma la foto de nuevo o exporta el PDF otra vez." } satisfies Error;
  }

  const tipo = a.tipo as TipoDocumento;
  const anteriores = await db.select({ id: documentos.id, ruta: documentos.rutaPrivada }).from(documentos).where(and(eq(documentos.proveedorId, proveedorId), eq(documentos.tipo, tipo)));
  const [nuevo] = await db.insert(documentos).values({ proveedorId, tipo, rutaPrivada: a.camino, mime: real, bytes: info.bytes }).returning({ id: documentos.id });
  if (anteriores.length) {
    await db.delete(documentos).where(inArray(documentos.id, anteriores.map((d) => d.id)));
    await borrarObjetos("privado", anteriores.map((d) => d.ruta));
  }
  return { id: nuevo!.id, tipo, mime: real, bytes: info.bytes };
}

/**
 * Regla 2: el equipo abre un documento con una URL firmada de pocos minutos y la apertura queda en `auditoria`.
 * Devuelve null si el documento no existe.
 */
export async function abrirDocumentoParaRevision(documentoId: string, actor: { id: string; rol: string }) {
  const [d] = await db.select({ proveedorId: documentos.proveedorId, ruta: documentos.rutaPrivada, tipo: documentos.tipo }).from(documentos).where(eq(documentos.id, documentoId)).limit(1);
  if (!d) return null;
  const url = await urlFirmada("privado", d.ruta, (await parametro("url_firmada_min")) * 60);
  await auditar({ actorId: actor.id, rol: actor.rol, accion: "documento_abierto", objetoTipo: "proveedor", objetoId: d.proveedorId, metadatos: { documentoId, tipo: d.tipo } });
  return url;
}
