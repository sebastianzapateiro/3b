/**
 * P8 / CU-36 · Fotos de trabajos del proveedor (portafolio público; cuentan para el nivel «destacado»).
 * Subida en dos pasos como los documentos: el navegador sube el original al bucket `privado` con una URL firmada;
 * `confirmarFoto` comprueba el tipo real, lo convierte a WebP (1600 px y miniatura de 400 px, sin EXIF ni GPS)
 * y publica solo el resultado en el bucket `publico`. El original se borra siempre.
 * Para el panel del proveedor y la API /api/v1/yo/fotos.
 */
import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@las3b/db";
import { borrarObjetos, descargar, firmarSubida, infoObjeto, leerInicio, subirObjeto, urlPublica } from "@/lib/almacenamiento";
import { guardarCompletitud } from "@/lib/completitud";
import { tipoReal } from "@/lib/documentos";
import { parametro } from "@/lib/parametros";

const { portafolioFotos } = schema;

/** Formatos que el navegador puede mostrar y sharp decodifica. */
export const MIME_FOTO = { "image/jpeg": "jpg", "image/png": "png" } as const;
type MimeFoto = keyof typeof MIME_FOTO;

type Error = { error: string };

const bytesMax = async () => (await parametro("foto_max_mb")) * 1024 * 1024;

/** Lo que el proveedor ve de sus fotos (con URL pública de la miniatura). */
export async function fotosDelProveedor(proveedorId: string) {
  const filas = await db
    .select({ id: portafolioFotos.id, ruta: portafolioFotos.ruta, miniatura: portafolioFotos.rutaMiniatura, descripcion: portafolioFotos.descripcion })
    .from(portafolioFotos)
    .where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible")))
    .orderBy(portafolioFotos.orden, portafolioFotos.createdAt);
  return filas.map((f) => ({ id: f.id, descripcion: f.descripcion, url: urlPublica(f.miniatura ?? f.ruta) }));
}

async function totalFotos(proveedorId: string) {
  const [r] = await db.select({ n: count() }).from(portafolioFotos).where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible")));
  return r?.n ?? 0;
}

/** Paso 1: valida lo declarado y entrega la URL firmada. El camino lo elige el servidor. */
export async function prepararFoto(proveedorId: string, a: { mime: string; bytes: number }, perfil = false): Promise<{ camino: string; url: string } | Error> {
  const ext = MIME_FOTO[a.mime as MimeFoto];
  if (!ext) return { error: "Formato no permitido. Usa fotos JPG o PNG." };
  const max = await bytesMax();
  if (!(a.bytes > 0) || a.bytes > max) return { error: `La foto debe pesar menos de ${max / 1024 / 1024} MB.` };
  const tope = await parametro("fotos_max");
  if (!perfil && (await totalFotos(proveedorId)) >= tope) return { error: `Ya tienes ${tope} fotos, el máximo. Quita alguna para subir otra.` };
  const camino = `fotos-temporales/${proveedorId}/${randomUUID()}.${ext}`;
  return { camino, url: await firmarSubida("privado", camino) };
}

/** Paso 2: procesa el original, publica WebP + miniatura y registra la foto. */
export async function confirmarFoto(proveedorId: string, a: { camino: string; declaraAutoria: boolean; descripcion?: string }) {
  if (!a.declaraAutoria) return { error: "Confirma que las fotos son de tu trabajo." } satisfies Error;
  const m = a.camino.match(new RegExp(`^fotos-temporales/${proveedorId}/([0-9a-f-]{36})\\.(jpg|png)$`));
  if (!m) return { error: "La subida no corresponde a tu perfil." } satisfies Error;

  try {
    const info = await infoObjeto("privado", a.camino);
    if (!info) return { error: "No recibimos la foto. Intenta subirla de nuevo." } satisfies Error;
    const real = tipoReal(await leerInicio("privado", a.camino));
    if (!real || !(real in MIME_FOTO) || MIME_FOTO[real as MimeFoto] !== m[2] || info.bytes > (await bytesMax())) {
      return { error: "El archivo no es una foto JPG o PNG válida. Toma la foto de nuevo." } satisfies Error;
    }
    if ((await totalFotos(proveedorId)) >= (await parametro("fotos_max"))) return { error: "Llegaste al máximo de fotos." } satisfies Error;

    const original = await descargar("privado", a.camino);
    // `rotate()` aplica la orientación del EXIF; sharp no copia los metadatos al resultado, así que se van EXIF y GPS.
    const grande = await sharp(original).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const chica = await sharp(original).rotate().resize({ width: 400, height: 400, fit: "cover" }).webp({ quality: 75 }).toBuffer();

    const base = `proveedores/${proveedorId}/${m[1]}`;
    await subirObjeto("publico", `${base}.webp`, grande, "image/webp");
    await subirObjeto("publico", `${base}-m.webp`, chica, "image/webp");

    const orden = await totalFotos(proveedorId);
    const [nueva] = await db
      .insert(portafolioFotos)
      .values({ proveedorId, ruta: `${base}.webp`, rutaMiniatura: `${base}-m.webp`, descripcion: a.descripcion?.trim().slice(0, 140) || null, declaraAutoria: true, orden })
      .returning({ id: portafolioFotos.id });
    await guardarCompletitud(proveedorId);
    return { id: nueva!.id };
  } catch (e) {
    console.error("[fotos] No se pudo procesar la foto:", e instanceof Error ? e.message : e);
    return { error: "No pudimos procesar la foto. Intenta con otra." } satisfies Error;
  } finally {
    await borrarObjetos("privado", [a.camino]);
  }
}

/** Quita una foto del proveedor (la oculta del portafolio y borra los archivos). */
export async function quitarFoto(proveedorId: string, fotoId: string) {
  const [f] = await db
    .select({ ruta: portafolioFotos.ruta, miniatura: portafolioFotos.rutaMiniatura })
    .from(portafolioFotos)
    .where(and(eq(portafolioFotos.id, fotoId), eq(portafolioFotos.proveedorId, proveedorId)))
    .limit(1);
  if (!f) return false;
  await db.delete(portafolioFotos).where(and(eq(portafolioFotos.id, fotoId), eq(portafolioFotos.proveedorId, proveedorId)));
  await borrarObjetos("publico", [f.ruta, ...(f.miniatura ? [f.miniatura] : [])]);
  await guardarCompletitud(proveedorId);
  return true;
}

/**
 * Foto de perfil (opcional y pública): misma subida en dos pasos, pero el resultado es un solo WebP cuadrado de 600 px
 * que se guarda en `proveedores.foto_perfil`. Exige la autorización para mostrarla (que no viene premarcada).
 */
export async function confirmarFotoPerfil(proveedorId: string, a: { camino: string; autoriza: boolean }) {
  if (!a.autoriza) return { error: "Confirma que eres tú en la foto y que autorizas mostrarla a los clientes." } satisfies Error;
  const m = a.camino.match(new RegExp(`^fotos-temporales/${proveedorId}/([0-9a-f-]{36})\\.(jpg|png)$`));
  if (!m) return { error: "La subida no corresponde a tu perfil." } satisfies Error;
  try {
    const info = await infoObjeto("privado", a.camino);
    if (!info) return { error: "No recibimos la foto. Intenta subirla de nuevo." } satisfies Error;
    const real = tipoReal(await leerInicio("privado", a.camino));
    if (!real || !(real in MIME_FOTO) || MIME_FOTO[real as MimeFoto] !== m[2] || info.bytes > (await bytesMax())) {
      return { error: "El archivo no es una foto JPG o PNG válida. Toma la foto de nuevo." } satisfies Error;
    }
    const chica = await sharp(await descargar("privado", a.camino)).rotate().resize({ width: 600, height: 600, fit: "cover" }).webp({ quality: 80 }).toBuffer();
    const ruta = `proveedores/${proveedorId}/perfil-${m[1]}.webp`;
    await subirObjeto("publico", ruta, chica, "image/webp");
    const [antes] = await db.select({ ruta: schema.proveedores.fotoPerfil }).from(schema.proveedores).where(eq(schema.proveedores.id, proveedorId)).limit(1);
    await db.update(schema.proveedores).set({ fotoPerfil: ruta, updatedAt: new Date() }).where(eq(schema.proveedores.id, proveedorId));
    if (antes?.ruta) await borrarObjetos("publico", [antes.ruta]);
    return { ok: true as const };
  } catch (e) {
    console.error("[fotos] No se pudo procesar la foto de perfil:", e instanceof Error ? e.message : e);
    return { error: "No pudimos procesar la foto. Intenta con otra." } satisfies Error;
  } finally {
    await borrarObjetos("privado", [a.camino]);
  }
}

/** Quita la foto de perfil (la borra del bucket público). */
export async function quitarFotoPerfil(proveedorId: string) {
  const [p] = await db.select({ ruta: schema.proveedores.fotoPerfil }).from(schema.proveedores).where(eq(schema.proveedores.id, proveedorId)).limit(1);
  if (!p?.ruta) return false;
  await db.update(schema.proveedores).set({ fotoPerfil: null, updatedAt: new Date() }).where(eq(schema.proveedores.id, proveedorId));
  await borrarObjetos("publico", [p.ruta]);
  return true;
}
