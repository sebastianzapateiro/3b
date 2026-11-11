/**
 * P3 / P8 · Autoguardado del alta completa (CU-30). El proveedor llena un solo formulario y cada campo se guarda en cuanto es válido,
 * sin exigir que termine ni que los demás estén bien: lo que no se puede guardar queda como aviso, nunca se pierde lo ya guardado.
 * Solo en borrador. Para el proveedor con sesión; el documento va cifrado (regla 1) y el vacío de un campo opcional lo borra.
 */
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db, protegerDocumento, schema } from "@las3b/db";
import { normalizarWhatsapp, opcionesComoTrabaja, PRESENTACION_MAX, redesDesdeFormulario, slugSchema, SLUGS_RESERVADOS } from "@las3b/shared";
import { registrarEvento } from "@/lib/actividad";
import { esMayorDeEdad } from "@/lib/alta-proveedor";
import { guardarCompletitud } from "@/lib/completitud";

const { proveedores, proveedorCategorias, proveedorLocalidades, categorias, localidades } = schema;

export const esquemaAlta = z.record(z.string(), z.union([z.string().max(600), z.array(z.string().max(20)).max(40)]));

export type ResultadoAlta = {
  /** Etiquetas de lo que se guardó (para decir «Guardado»). */
  guardados: string[];
  /** Lo que no se pudo guardar y por qué, por nombre de campo. El proveedor lo corrige cuando pueda. */
  avisos: Record<string, string>;
  /** Cambió algo de lo que dependen otras secciones (oficios, localidades, dirección de página): la pantalla debe refrescarse. */
  recargar: boolean;
};

export async function autoguardarAlta(proveedor: { id: string; estado: string }, entrada: unknown): Promise<ResultadoAlta> {
  const vacio: ResultadoAlta = { guardados: [], avisos: {}, recargar: false };
  if (proveedor.estado !== "borrador") return vacio;
  const datos = esquemaAlta.safeParse(entrada);
  if (!datos.success) return vacio;
  const d = datos.data;
  const texto = (k: string) => (typeof d[k] === "string" ? (d[k] as string).trim() : undefined);
  const lista = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : typeof d[k] === "string" && d[k] ? [d[k] as string] : []);

  const avisos: Record<string, string> = {};
  const guardados: string[] = [];
  const cambios: Partial<typeof proveedores.$inferInsert> = {};
  let recargar = false;

  // Contacto
  const nombre = texto("nombrePublico");
  if (nombre !== undefined) {
    if (nombre.length >= 2 && nombre.length <= 80) { cambios.nombrePublico = nombre; guardados.push("nombre"); } else if (nombre) avisos.nombrePublico = "El nombre debe tener entre 2 y 80 letras.";
  }
  const wa = texto("whatsapp");
  if (wa) {
    const n = normalizarWhatsapp(wa);
    if (n) { cambios.whatsapp = n; guardados.push("WhatsApp"); } else avisos.whatsapp = "Falta completar el WhatsApp: son 10 dígitos, por ejemplo 300 123 4567.";
  }

  // Negocio
  const segmento = texto("segmento");
  if (segmento) {
    if (segmento === "independiente_sin_rut" || segmento === "independiente_con_rut" || segmento === "empresa") { cambios.segmento = segmento; guardados.push("tipo de trabajo"); }
  }
  const slug = texto("slug");
  if (slug) {
    const ok = slugSchema.safeParse(slug).success && !SLUGS_RESERVADOS.has(slug);
    if (!ok) avisos.slug = "La dirección admite minúsculas, números y guiones (mínimo 3 caracteres).";
    else {
      const [ocupado] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, slug)).limit(1);
      if (ocupado && ocupado.id !== proveedor.id) avisos.slug = "Esa dirección ya está en uso. Prueba otra.";
      else { cambios.slug = slug; guardados.push("dirección de tu página"); recargar = true; }
    }
  }

  // Perfil
  const sobre = texto("presentacion");
  if (sobre !== undefined) {
    if (sobre.length <= PRESENTACION_MAX) { cambios.presentacion = sobre || null; guardados.push("sobre ti"); } else avisos.presentacion = `La presentación admite hasta ${PRESENTACION_MAX} caracteres.`;
  }
  const anios = texto("aniosExperiencia");
  if (anios !== undefined) {
    const n = Number(anios);
    if (anios === "") cambios.aniosExperiencia = null;
    else if (Number.isInteger(n) && n >= 0 && n <= 80) { cambios.aniosExperiencia = n; guardados.push("años de experiencia"); } else avisos.aniosExperiencia = "Escribe los años de experiencia entre 0 y 80.";
  }
  if (d._como !== undefined) {
    const garantia = "ofreceGarantia" in d, urgencias = "atiendeUrgencias" in d, h24 = "disponible24h" in d;
    Object.assign(cambios, { ofreceGarantia: garantia, atiendeUrgencias: urgencias, disponible24h: h24, visitaAConvenir: "visitaAConvenir" in d || !(garantia || urgencias || h24) });
    guardados.push("cómo trabajas");
  }

  // Identidad (privada): el documento se guarda cifrado; la dirección y la matrícula son opcionales y se pueden vaciar.
  const tipo = texto("tipoDocumento");
  if (tipo === "cc" || tipo === "ce" || tipo === "ppt" || tipo === "nit") cambios.tipoDocumento = tipo;
  const documento = texto("documento");
  if (documento) {
    if (/^[0-9A-Za-z-]{4,20}$/.test(documento)) { Object.assign(cambios, protegerDocumento(documento)); guardados.push("documento"); } else avisos.documento = "El número de documento va sin puntos ni espacios.";
  }
  const nacimiento = texto("fechaNacimiento");
  if (nacimiento) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento)) avisos.fechaNacimiento = "Escribe tu fecha de nacimiento completa.";
    else if (!esMayorDeEdad(nacimiento)) avisos.fechaNacimiento = "Debes ser mayor de edad para registrarte como proveedor.";
    else { cambios.fechaNacimiento = nacimiento; guardados.push("fecha de nacimiento"); }
  }
  const direccion = texto("direccionNotificaciones");
  if (direccion !== undefined && direccion.length <= 160) { if (direccion) guardados.push("dirección"); cambios.direccionNotificaciones = direccion || null; }
  else if (direccion) avisos.direccionNotificaciones = "La dirección admite hasta 160 caracteres.";
  const matricula = texto("numeroMatricula");
  if (matricula !== undefined && matricula.length <= 30) { cambios.numeroMatricula = matricula || null; if (matricula) guardados.push("matrícula"); }

  // Redes sociales
  if (Object.keys(d).some((k) => k.startsWith("red_"))) {
    const { redes, error } = redesDesdeFormulario((n) => texto(n) ?? "");
    if (error) avisos.redes = error;
    else { cambios.redesSociales = Object.keys(redes).length > 0 ? redes : null; guardados.push("redes sociales"); }
  }

  // Oficios y localidades: solo se reemplazan si llega al menos uno válido (nunca se vacía por un envío incompleto).
  const oficioIds = [...new Set(lista("categoria").map(Number).filter((c) => Number.isInteger(c) && c > 0))];
  let slugsOficios: string[] | null = null;
  if (oficioIds.length > 3) avisos.categoria = "Elige máximo 3 oficios.";
  else if (oficioIds.length > 0) {
    const validas = await db.select({ id: categorias.id, slug: categorias.slug }).from(categorias).where(and(inArray(categorias.id, oficioIds), isNotNull(categorias.padreId), eq(categorias.activa, true)));
    if (validas.length !== oficioIds.length) avisos.categoria = "Uno de los oficios no está disponible.";
    else {
      const actuales = await db.select({ id: proveedorCategorias.categoriaId }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedor.id));
      const iguales = actuales.length === oficioIds.length && actuales.every((a) => oficioIds.includes(a.id));
      if (!iguales) {
        await db.transaction(async (tx) => {
          await tx.delete(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedor.id));
          await tx.insert(proveedorCategorias).values(oficioIds.map((categoriaId) => ({ proveedorId: proveedor.id, categoriaId })));
        });
        guardados.push("oficios");
        recargar = true;
        slugsOficios = validas.map((v) => v.slug);
      }
    }
  }
  const localidadIds = [...new Set(lista("localidad").map(Number).filter((c) => Number.isInteger(c) && c > 0))];
  if (localidadIds.length > 0) {
    const validas = await db.select({ id: localidades.id }).from(localidades).where(and(inArray(localidades.id, localidadIds), eq(localidades.activa, true)));
    const actuales = await db.select({ id: proveedorLocalidades.localidadId }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedor.id));
    const ids = validas.map((v) => v.id);
    if (!(actuales.length === ids.length && actuales.every((a) => ids.includes(a.id)))) {
      await db.transaction(async (tx) => {
        await tx.delete(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedor.id));
        await tx.insert(proveedorLocalidades).values(ids.map((localidadId) => ({ proveedorId: proveedor.id, localidadId })));
      });
      guardados.push("localidades");
    }
  }

  // Si cambió de oficio, se quitan las opciones de «Cómo trabajas» que ya no le aplican (en el alta no hay nada que perder).
  if (slugsOficios) {
    const op = opcionesComoTrabaja(slugsOficios);
    if (!op.has("ofreceGarantia")) cambios.ofreceGarantia = false;
    if (!op.has("atiendeUrgencias")) cambios.atiendeUrgencias = false;
    if (!op.has("disponible24h")) cambios.disponible24h = false;
  }

  if (Object.keys(cambios).length > 0) {
    await db.update(proveedores).set({ ...cambios, updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
  }
  if (guardados.length > 0 || Object.keys(cambios).length > 0) {
    await guardarCompletitud(proveedor.id);
    await registrarEvento(proveedor.id, "cambios", { campos: guardados.length > 0 ? guardados : ["perfil"], detalle: "Guardado automático" });
  }
  return { guardados: [...new Set(guardados)], avisos, recargar };
}
