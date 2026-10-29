'use server';

/**
 * P3 · Alta de proveedor en 3 pasos (CU-30 / CU-32).
 * Server Actions para guardar cada paso del registro de proveedor.
 * Estados: borrador → pendiente → aprobado | rechazado.
 */
import { auth } from "@/lib/auth";
import { ipDeLaPeticion, registrarConsentimientos } from "@/lib/consentimientos";
import { headers } from "next/headers";
import { db, schema } from "@las3b/db";
import { slugSchema } from "@las3b/shared";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";

const {
  proveedores,
  proveedorCategorias,
  proveedorLocalidades,
  serviciosProveedor,
  documentos,
  categorias,
  localidades,
  user,
} = schema;

type EstadoRegistro =
  | "borrador"
  | "pendiente"
  | "aprobado"
  | "rechazado"
  | "en_revision"
  | "pausado"
  | "pausado_por_rut"
  | "suspendido";

async function obtenerUsuario(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

async function obtenerProveedorPorUsuario(usuarioId: string) {
  return db
    .select({ id: proveedores.id, estado: proveedores.estado })
    .from(proveedores)
    .where(eq(proveedores.usuarioId, usuarioId))
    .limit(1);
}

async function verificarCategoriaExigeRut(categoriaId: number): Promise<boolean> {
  const [c] = await db
    .select({ exigeRutDesdeAlta: categorias.exigeRutDesdeAlta })
    .from(categorias)
    .where(eq(categorias.id, categoriaId))
    .limit(1);
  return c?.exigeRutDesdeAlta ?? false;
}

async function verificarCategoriaExigeMenores(categoriaId: number | null): Promise<boolean> {
  if (categoriaId == null) return false;
  const [c] = await db
    .select({ exigeInsigniaMenores: categorias.exigeInsigniaMenores })
    .from(categorias)
    .where(eq(categorias.id, categoriaId))
    .limit(1);
  return c?.exigeInsigniaMenores ?? false;
}

/** Paso 1 · Datos básicos: crea el proveedor en borrador o lo actualiza. */
export async function guardarPaso1(formData: FormData) {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Debes iniciar sesión para registrarte como proveedor." };

  const existente = await obtenerProveedorPorUsuario(usuario.id);
  if (existente) {
    return { error: "Ya tienes un perfil de proveedor registrado." };
  }

  const nombrePublico = String(formData.get("nombrePublico") ?? "").trim();
  const segmento = String(formData.get("segmento") ?? "");
  const categoriaIdRaw = formData.get("categoriaId");
  const localidadIdRaw = formData.get("localidadId");
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();

  if (!nombrePublico || !segmento || !categoriaIdRaw || !localidadIdRaw || !whatsapp || !slugRaw) {
    return { error: "Faltan campos requeridos." };
  }

  const categoriaId = Number(categoriaIdRaw);
  const localidadId = Number(localidadIdRaw);

  const slugValido = slugSchema.safeParse(slugRaw);
  if (!slugValido.success) {
    return { error: "Slug inválido. Usa solo minúsculas, números y guiones." };
  }

  const [slugExiste] = await db
    .select({ id: proveedores.id })
    .from(proveedores)
    .where(eq(proveedores.slug, slugRaw))
    .limit(1);
  if (slugExiste) {
    return { error: "Esa dirección ya está en uso. Prueba otra." };
  }

  // Si es empresa o categoría de riesgo alto, RUT obligatorio desde el registro
  const exigeRut = segmento === "empresa" || (await verificarCategoriaExigeRut(categoriaId));

  const [p] = await db
    .insert(proveedores)
    .values({
      usuarioId: usuario.id,
      estado: "borrador",
      segmento: segmento as "independiente_sin_rut" | "independiente_con_rut" | "empresa",
      nombrePublico,
      slug: slugRaw,
      whatsapp,
    })
    .returning({ id: proveedores.id });

  if (!p) return { error: "No se pudo crear el perfil de proveedor." };

  await db.insert(proveedorCategorias).values({
    proveedorId: p.id,
    categoriaId,
  });

  await db.insert(proveedorLocalidades).values({
    proveedorId: p.id,
    localidadId,
  });

  return { ok: true, proveedorId: p.id, requiereRut: exigeRut, requiereMenores: await verificarCategoriaExigeMenores(categoriaId) };
}

/** Paso 2 · Qué ofrece y dónde: servicios, presentación, experiencia, localidades adicionales. */
export async function guardarPaso2(formData: FormData) {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Debes iniciar sesión." };

  const [p] = await obtenerProveedorPorUsuario(usuario.id);
  if (!p) return { error: "No se encontró el perfil de proveedor." };
  if (p.estado !== "borrador") return { error: "El perfil ya no está en borrador." };

  const presentacion = String(formData.get("presentacion") ?? "").trim() || null;
  const aniosExperienciaRaw = formData.get("aniosExperiencia");
  const aniosExperiencia = aniosExperienciaRaw ? Number(aniosExperienciaRaw) : undefined;

  const serviciosRaw = formData.getAll("servicios[]") as string[];
  const preciosRaw = formData.getAll("precios[]") as string[];
  const unidadesRaw = formData.getAll("unidades[]") as string[];
  const localidadesAdicionalesRaw = formData.getAll("localidades[]") as string[];

  // Actualizar proveedor
  await db
    .update(proveedores)
    .set({ presentacion, aniosExperiencia, updatedAt: new Date() })
    .where(eq(proveedores.id, p.id));

  // Reemplazar servicios
  await db.delete(serviciosProveedor).where(eq(serviciosProveedor.proveedorId, p.id));
  if (serviciosRaw.length > 0) {
    await db.insert(serviciosProveedor).values(
      serviciosRaw.map((nombre, i) => ({
        proveedorId: p.id,
        nombre: nombre.trim(),
        descripcion: null,
        precioDesde: preciosRaw[i] ?? null,
        unidad: (unidadesRaw[i] ?? "visita") as any,
        orden: i,
        visible: true,
      })),
    );
  }

  // Reemplazar localidades (mantener la del paso 1 + adicionales)
  const existentes = await db
    .select({ localidadId: proveedorLocalidades.localidadId })
    .from(proveedorLocalidades)
    .where(eq(proveedorLocalidades.proveedorId, p.id));
  const idsExistentes = new Set(existentes.map((e) => e.localidadId));

  for (const locIdRaw of localidadesAdicionalesRaw) {
    const locId = Number(locIdRaw);
    if (!idsExistentes.has(locId)) {
      await db.insert(proveedorLocalidades).values({ proveedorId: p.id, localidadId: locId });
    }
  }

  return { ok: true };
}

/** Paso 3 · Verificación: documento, dirección, fecha nacimiento, RUT (si aplica), OTP. */
export async function guardarPaso3(formData: FormData) {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Debes iniciar sesión." };

  const [p] = await obtenerProveedorPorUsuario(usuario.id);
  if (!p) return { error: "No se encontró el perfil de proveedor." };
  if (p.estado !== "borrador") return { error: "El perfil ya no está en borrador." };

  const tipoDocumento = String(formData.get("tipoDocumento") ?? "");
  const documento = String(formData.get("documento") ?? "").trim();
  const direccionNotificaciones = String(formData.get("direccionNotificaciones") ?? "").trim();
  const fechaNacimientoRaw = formData.get("fechaNacimiento");
  const fechaNacimiento = fechaNacimientoRaw ? String(fechaNacimientoRaw) : null;
  const rut = String(formData.get("rut") ?? "").trim();

  if (!tipoDocumento || !documento || !direccionNotificaciones || !fechaNacimiento) {
    return { error: "Faltan campos requeridos de verificación." };
  }

  // Verificar mayoría de edad (18 años)
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (edad < 18 || (edad === 18 && mes < 0)) {
    return { error: "Debes ser mayor de edad para registrarte como proveedor." };
  }

  // Verificar si RUT es obligatorio
  const [prov] = await db
    .select({
      segmento: proveedores.segmento,
      categoriaId: proveedorCategorias.categoriaId,
    })
    .from(proveedores)
    .leftJoin(proveedorCategorias, eq(proveedorCategorias.proveedorId, proveedores.id))
    .where(eq(proveedores.id, p.id))
    .limit(1);

  const exigeRut =
    prov?.segmento === "empresa" ||
    (prov?.categoriaId != null &&
      (await verificarCategoriaExigeRut(prov.categoriaId as number)));

  if (exigeRut && !rut) {
    return { error: "El RUT es obligatorio para tu categoría o segmento." };
  }

  // Consentimientos (RF-19, Ley 1581): casillas no premarcadas; se guarda versión, fecha e IP.
  const exigeMenores = await verificarCategoriaExigeMenores((prov?.categoriaId as number | null | undefined) ?? null);
  if (formData.get("aceptaTerminosProveedor") !== "on") return { error: "Debes aceptar los términos para proveedores." };
  if (formData.get("aceptaDatos") !== "on") return { error: "Debes autorizar el tratamiento de tus datos personales para verificar tu identidad." };
  if (exigeMenores && formData.get("autorizaLey1918") !== "on") {
    return { error: "Tu categoría trabaja con menores: debes autorizar la consulta de antecedentes (Ley 1918)." };
  }
  try {
    const h = await headers();
    await registrarConsentimientos(
      usuario.id,
      ["terminos_proveedores", "tratamiento_datos", ...(exigeMenores ? (["autorizacion_ley_1918"] as const) : [])],
      { ip: ipDeLaPeticion(h), userAgent: h.get("user-agent") },
    );
  } catch (e) {
    console.error("[alta proveedor] No se pudieron registrar los consentimientos", e);
    return { error: "No pudimos registrar tu autorización. Intenta de nuevo en un momento." };
  }

  const rutFechaLimite = exigeRut
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db
    .update(proveedores)
    .set({
      estado: "pendiente",
      segmento: prov?.segmento as any,
      tipoDocumento: tipoDocumento as any,
      documentoCifrado: documento,
      direccionNotificaciones,
      fechaNacimiento: new Date(fechaNacimiento).toISOString(),
      rutFechaLimite,
      updatedAt: new Date(),
    })
    .where(eq(proveedores.id, p.id));

  redirect("/proveedores/registro/recibido");
}

/** Envía OTP por WhatsApp (simulado en desarrollo: se muestra en consola). */
export async function enviarOTP(formData: FormData) {
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (!whatsapp) return { error: "Falta el número de WhatsApp." };

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  console.info(`[OTP] Código para ${whatsapp}: ${codigo}`);

  // En producción, aquí se enviaría por WhatsApp y se guardaría el hash en la sesión/BD.
  return { ok: true, codigo: codigo === "123456" ? codigo : undefined }; // código de prueba en dev
}

/** Verifica OTP y avanza a pendiente. */
export async function verificarOTP(formData: FormData) {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Debes iniciar sesión." };

  const codigoIngresado = String(formData.get("codigo") ?? "").trim();
  // En desarrollo aceptar "123456". En producción verificar contra hash almacenado.
  if (codigoIngresado !== "123456") {
    return { error: "Código incorrecto." };
  }

  const [p] = await obtenerProveedorPorUsuario(usuario.id);
  if (!p) return { error: "No se encontró el perfil de proveedor." };

  await db
    .update(proveedores)
    .set({ estado: "pendiente", updatedAt: new Date() })
    .where(eq(proveedores.id, p.id));

  redirect("/proveedores/registro/recibido");
}
