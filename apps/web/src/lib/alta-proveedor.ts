/**
 * P3 / P8 · Alta de proveedor dentro del panel (CU-30). Al elegir «proveedor» se crea un borrador y la persona
 * entra directo a /panel, donde completa las tareas pendientes y envía a revisión.
 * Para el proveedor con sesión. Los datos de identidad nunca salen en público (regla 1).
 */
import { guardarOrigen, origenDeCabeceras, registrarEvento } from "@/lib/actividad";
import { cache } from "react";
import { and, count, eq, inArray, isNotNull, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { consultar, db, protegerDocumento, schema } from "@las3b/db";
import { normalizarWhatsapp, slugSchema, sugerirSlug, SLUGS_RESERVADOS } from "@las3b/shared";
import { estadoDocumentos } from "@/lib/documentos";
import { FOTOS_MINIMAS, guardarCompletitud } from "@/lib/completitud";

const { proveedores, proveedorCategorias, proveedorLocalidades, serviciosProveedor, categorias, portafolioFotos } = schema;

type Resultado = { ok: true } | { error: string };

/** Primera dirección libre a partir de una base: «jairo-perez», «jairo-perez-2», … */
export async function slugLibre(base: string): Promise<string> {
  const raiz = slugSchema.safeParse(base).success ? base : `proveedor-${base || "nuevo"}`.slice(0, 50).replace(/-+$/, "");
  for (let i = 1; i < 50; i++) {
    const candidato = i === 1 ? raiz : `${raiz}-${i}`;
    if (SLUGS_RESERVADOS.has(candidato)) continue;
    const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, candidato)).limit(1);
    if (!existe) return candidato;
  }
  return `${raiz}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Crea el borrador del proveedor (idempotente). Nombre y dirección salen de la cuenta; se editan en el panel. */
export async function crearBorrador(usuario: { id: string; name?: string | null; email: string; telefono?: string | null }, cabeceras?: Headers, oficioSlugs: string[] = []) {
  const [existe] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.usuarioId, usuario.id)).limit(1);
  if (existe) return existe.id;
  const nombre = usuario.name?.trim() || usuario.email.split("@")[0]!;
  // Los oficios elegidos al crear la cuenta: solo los que existen y están activos, máximo 3 (los servicios van dentro de ellos).
  const slugs = [...new Set(oficioSlugs)].slice(0, 3);
  const validas = slugs.length > 0 ? await db.select({ id: categorias.id }).from(categorias).where(and(inArray(categorias.slug, slugs), isNotNull(categorias.padreId), eq(categorias.activa, true))) : [];
  // Dirección automática con el modelo de la plataforma: el nombre («clemencia-rojas»), con número si ya existe. El oficio va en la URL pública (/nombre/oficio).
  const direccion = await slugLibre(sugerirSlug(nombre));
  const [p] = await db
    .insert(proveedores)
    .values({ usuarioId: usuario.id, estado: "borrador", nombrePublico: nombre, slug: direccion, whatsapp: normalizarWhatsapp(usuario.telefono ?? "") ?? "" })
    .onConflictDoNothing({ target: proveedores.usuarioId })
    .returning({ id: proveedores.id });
  if (p) {
    if (validas.length > 0) await db.insert(proveedorCategorias).values(validas.map((c) => ({ proveedorId: p.id, categoriaId: c.id }))).onConflictDoNothing();
    await guardarCompletitud(p.id);
    // Origen (UTM) del primer ingreso y aviso al fundador (B1). Ninguno de los dos puede frenar el registro.
    await guardarOrigen(p.id, origenDeCabeceras(cabeceras));
    await registrarEvento(p.id, "creado", { campos: ["registro"], clave: `creado:${p.id}` });
    return p.id;
  }
  // Otra petición lo creó al mismo tiempo.
  const [otro] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.usuarioId, usuario.id)).limit(1);
  return otro!.id;
}

/**
 * A dónde entra el proveedor al panel tras crear su cuenta: con el perfil recién creado (borrador, sin servicios)
 * lo siguiente es crear sus servicios; en cualquier otro caso, al Resumen.
 */
export async function rutaInicialProveedor(usuarioId: string): Promise<string> {
  const [p] = await db.select({ id: proveedores.id, estado: proveedores.estado }).from(proveedores).where(eq(proveedores.usuarioId, usuarioId)).limit(1);
  if (!p || p.estado !== "borrador") return "/panel";
  const [cats, servs] = await Promise.all([
    db.select({ n: count() }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, p.id)),
    db.select({ n: count() }).from(serviciosProveedor).where(eq(serviciosProveedor.proveedorId, p.id)),
  ]);
  return (cats[0]?.n ?? 0) > 0 && (servs[0]?.n ?? 0) === 0 ? "/panel/alta?bienvenida=1#servicios" : "/panel?bienvenida=1";
}

/**
 * Cuentas con el rol «proveedor» que no tienen perfil (por ejemplo, las que el equipo creó desde «Crear usuario»):
 * les crea el perfil en borrador. Idempotente. Devuelve cuántas creó.
 */
export async function crearPerfilesFaltantes(): Promise<number> {
  const sin = await consultar<{ id: string; name: string; email: string; telefono: string | null }>(sql`
    SELECT u.id, u.name, u.email, u.telefono
    FROM "user" u
    JOIN usuario_roles r ON r.usuario_id = u.id AND r.rol = 'proveedor'
    WHERE u.eliminado_en IS NULL AND NOT EXISTS (SELECT 1 FROM proveedores p WHERE p.usuario_id = u.id)`);
  for (const u of sin) await crearBorrador(u);
  return sin.length;
}

export type SeccionPanel = "perfil" | "servicios" | "fotos" | "verificacion";
export type TareaAlta = { clave: string; titulo: string; texto: string; ok: boolean; href: string; seccion: SeccionPanel; opcional?: boolean; /** Ya guardó algo pero falta: se muestra «Completar»; sin nada, «Empezar». */ iniciada?: boolean };

/**
 * Qué le falta al borrador para enviarlo a revisión. `listo` ignora las tareas opcionales.
 * Con cache(): el layout y la página del panel lo piden en la misma petición y se consulta una sola vez.
 */
export const pendientesAlta = cache(async (proveedorId: string) => {
  const [[p], [cats], [locs], [servs], docs, [fotos]] = await Promise.all([
    db
      .select({
        estado: proveedores.estado,
        nombre: proveedores.nombrePublico,
        whatsapp: proveedores.whatsapp,
        segmento: proveedores.segmento,
        presentacion: proveedores.presentacion,
        tipoDocumento: proveedores.tipoDocumento,
        documento: proveedores.documentoCifrado,
        direccion: proveedores.direccionNotificaciones,
        nacimiento: proveedores.fechaNacimiento,
        fotoPerfil: proveedores.fotoPerfil,
      })
      .from(proveedores)
      .where(eq(proveedores.id, proveedorId))
      .limit(1),
    db.select({ n: count() }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
    db.select({ n: count() }).from(proveedorLocalidades).where(eq(proveedorLocalidades.proveedorId, proveedorId)),
    db.select({ n: count() }).from(serviciosProveedor).where(eq(serviciosProveedor.proveedorId, proveedorId)),
    estadoDocumentos(proveedorId),
    db.select({ n: count() }).from(portafolioFotos).where(and(eq(portafolioFotos.proveedorId, proveedorId), eq(portafolioFotos.estado, "visible"))),
  ]);
  const tareas: TareaAlta[] = [
    { clave: "contacto", titulo: "Tus datos de contacto", texto: "Tu nombre, tu WhatsApp y tu correo. Es lo primero: así podemos escribirte.", ok: Boolean(p?.nombre.trim() && p.whatsapp.trim()), iniciada: Boolean(p?.nombre.trim() || p?.whatsapp.trim()), href: "/panel/perfil#contacto", seccion: "perfil" },
    // Lo básico se pide al crear la cuenta (nombre, correo, WhatsApp y oficios); lo siguiente son los servicios, y luego el resto del perfil.
    { clave: "oficios", titulo: "Tus oficios", texto: "A qué te dedicas. Cada servicio que ofrezcas va dentro de uno de tus oficios.", ok: (cats?.n ?? 0) > 0, href: "/panel/perfil#negocio", seccion: "perfil" },
    { clave: "servicios", titulo: "Tus servicios y precios", texto: "Lo que haces dentro de cada oficio, con su precio desde. Al menos uno.", ok: (servs?.n ?? 0) > 0, href: "/panel/servicios", seccion: "servicios" },
    { clave: "negocio", titulo: "Cómo trabajas y tu página", texto: "Si eres independiente o empresa y la dirección de tu página.", ok: Boolean(p?.segmento), iniciada: Boolean(p?.segmento), href: "/panel/perfil#negocio", seccion: "perfil" },
    { clave: "localidades", titulo: "Dónde trabajas", texto: "Las localidades de Bogotá en las que atiendes.", ok: (locs?.n ?? 0) > 0, href: "/panel/perfil#localidades", seccion: "perfil" },
    { clave: "identidad", titulo: "Datos de identidad", texto: "Tu cédula y fecha de nacimiento (la dirección es opcional). Son privados.", ok: Boolean(p?.tipoDocumento && p.documento && p.nacimiento), iniciada: Boolean(p?.tipoDocumento || p?.documento || p?.direccion || p?.nacimiento), href: "/panel/verificacion#identidad", seccion: "verificacion" },
    { clave: "documentos", titulo: "Tu documento", texto: "Opcional: la foto de tu documento ayuda a verificar tu perfil. Es privada, solo la ve el equipo.", ok: docs.lista.some((r) => r.tipo === "documento_frente" && r.cargado), iniciada: docs.lista.some((r) => r.cargado), href: "/panel/verificacion#documentos", seccion: "verificacion", opcional: true },
    { clave: "foto", titulo: "Tu foto de perfil", texto: "Opcional, pero los clientes confían más en perfiles con foto. Se muestra en tu perfil.", ok: Boolean(p?.fotoPerfil), href: "/panel/perfil#foto", seccion: "perfil", opcional: true },
    { clave: "fotos", titulo: "Fotos de tus trabajos", texto: `Sube al menos ${FOTOS_MINIMAS}: los clientes escriben más cuando ven tu trabajo.`, ok: (fotos?.n ?? 0) >= FOTOS_MINIMAS, iniciada: (fotos?.n ?? 0) > 0, href: "/panel/fotos", seccion: "fotos", opcional: true },
    { clave: "sobre", titulo: "Sobre mí", texto: "Cuéntales a los clientes cómo trabajas. Ayuda a que te escriban.", ok: Boolean(p?.presentacion?.trim()), href: "/panel/perfil#sobre", seccion: "perfil", opcional: true },
  ];
  // En borrador todo el alta vive en una sola página (/panel/alta): cada tarea lleva a su bloque dentro de ella.
  if (p?.estado === "borrador") {
    for (const t of tareas) {
      const ancla = t.href.split("#")[1] ?? (t.clave === "servicios" ? "servicios" : t.clave === "fotos" ? "fotos-trabajos" : "");
      t.href = `/panel/alta${ancla ? `#${ancla}` : ""}`;
    }
  }
  const obligatorias = tareas.filter((t) => !t.opcional);
  const hechas = tareas.filter((t) => t.ok).length;
  return {
    tareas,
    hechas,
    porcentaje: Math.round((hechas / tareas.length) * 100),
    listo: obligatorias.every((t) => t.ok),
    /** Primera obligatoria pendiente; si no hay, la primera opcional pendiente. */
    siguiente: obligatorias.find((t) => !t.ok) ?? tareas.find((t) => !t.ok) ?? null,
    faltanDocs: docs.faltan,
  };
});

export type AltaProveedor = Awaited<ReturnType<typeof pendientesAlta>>;

/** A dónde llevar al proveedor después de guardar un paso del alta: la siguiente tarea obligatoria, o al Resumen para enviar. */
export async function rutaSiguientePaso(proveedorId: string, aviso: string): Promise<string> {
  const alta = await pendientesAlta(proveedorId);
  const falta = alta.tareas.find((t) => !t.ok && !t.opcional);
  if (!falta) return `/panel?${new URLSearchParams({ ok: `${aviso} Ya tienes todo: revisa y publica tu perfil.` })}`;
  const [ruta, ancla] = falta.href.split("#");
  return `${ruta}?${new URLSearchParams({ ok: `${aviso} Sigue con: ${falta.titulo.toLowerCase()}.` })}${ancla ? `#${ancla}` : ""}`;
}

/** Oficios que puede elegir el proveedor (subcategorías activas). */
export async function oficiosDisponibles() {
  return db.select({ id: categorias.id, nombre: categorias.nombre, slug: categorias.slug }).from(categorias).where(and(isNotNull(categorias.padreId), eq(categorias.activa, true))).orderBy(asc(categorias.nombre));
}

/** Oficios disponibles y los que ya eligió el proveedor, para el formulario del negocio. */
export async function negocioEditable(proveedorId: string) {
  const [oficios, elegidos] = await Promise.all([
    oficiosDisponibles(),
    db.select({ id: proveedorCategorias.categoriaId }).from(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedorId)),
  ]);
  return { oficios, elegidos: new Set(elegidos.map((e) => e.id)) };
}

const esquemaContacto = z.object({
  nombrePublico: z.string().trim().min(2, "Escribe el nombre con el que te van a ver los clientes.").max(80, "El nombre admite hasta 80 caracteres."),
  whatsapp: z.string().transform((v, ctx) => normalizarWhatsapp(v) ?? (ctx.addIssue({ code: "custom", message: "Escribe un WhatsApp válido, por ejemplo 300 123 4567." }), z.NEVER)),
});

const esquemaNegocio = z.object({
  segmento: z.enum(["independiente_sin_rut", "independiente_con_rut", "empresa"], { message: "Elige si eres independiente o empresa." }),
  slug: slugSchema,
});

/** Lo primero que se le pide al proveedor: nombre y WhatsApp (el correo ya viene de la cuenta). Se guarda aparte, al instante. */
export async function guardarContacto(proveedor: { id: string; estado: string }, formData: FormData): Promise<Resultado> {
  if (proveedor.estado !== "borrador") return { error: "Tu perfil ya fue enviado: para cambiar estos datos escríbenos." };
  const r = esquemaContacto.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  await db.update(proveedores).set({ nombrePublico: r.data.nombrePublico, whatsapp: r.data.whatsapp, updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
  await guardarCompletitud(proveedor.id);
  await registrarEvento(proveedor.id, "cambios", { campos: ["nombre", "WhatsApp"] });
  return { ok: true };
}

/**
 * Datos del negocio: solo mientras es borrador (después, nombre, dirección y oficio los revisa el equipo).
 */
export async function guardarNegocio(proveedor: { id: string; estado: string }, formData: FormData): Promise<Resultado> {
  if (proveedor.estado !== "borrador") return { error: "Tu perfil ya fue enviado: para cambiar estos datos escríbenos." };
  const r = esquemaNegocio.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  // Los desplegables vacíos llegan como "" (= 0): se descartan, igual que los repetidos.
  const categoriaIds = [...new Set(formData.getAll("categoria").map(Number).filter((c) => Number.isInteger(c) && c > 0))];
  if (categoriaIds.length === 0) return { error: "Elige al menos un oficio." };
  if (categoriaIds.length > 3) return { error: "Elige máximo 3 oficios." };

  const [ocupado] = await db.select({ id: proveedores.id }).from(proveedores).where(eq(proveedores.slug, r.data.slug)).limit(1);
  if (ocupado && ocupado.id !== proveedor.id) return { error: "Esa dirección ya está en uso. Prueba otra." };
  const validas = await db.select({ id: categorias.id }).from(categorias).where(and(inArray(categorias.id, categoriaIds), isNotNull(categorias.padreId), eq(categorias.activa, true)));
  if (validas.length !== categoriaIds.length) return { error: "Uno de los oficios no está disponible." };

  await db.transaction(async (tx) => {
    await tx.update(proveedores).set({ ...r.data, updatedAt: new Date() }).where(eq(proveedores.id, proveedor.id));
    await tx.delete(proveedorCategorias).where(eq(proveedorCategorias.proveedorId, proveedor.id));
    await tx.insert(proveedorCategorias).values(categoriaIds.map((categoriaId) => ({ proveedorId: proveedor.id, categoriaId })));
  });
  await guardarCompletitud(proveedor.id);
  await registrarEvento(proveedor.id, "cambios", { campos: ["oficios", "tipo de trabajo", "dirección de la página"] });
  return { ok: true };
}

const esquemaIdentidad = z.object({
  tipoDocumento: z.enum(["cc", "ce", "ppt", "nit"], { message: "Elige el tipo de documento." }),
  documento: z.string().trim().regex(/^[0-9A-Za-z-]{4,20}$/, "Escribe el número de documento sin puntos ni espacios."),
  // La dirección es opcional: no se le exige a nadie.
  direccionNotificaciones: z.string().trim().max(160, "La dirección admite hasta 160 caracteres.").optional(),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe tu fecha de nacimiento."),
  numeroMatricula: z.string().trim().max(30, "El número de matrícula admite hasta 30 caracteres.").optional(),
});

/** Mayor de edad a la fecha de hoy (Colombia: 18 años). */
export function esMayorDeEdad(fechaIso: string, hoy = new Date()): boolean {
  const [a, m, d] = fechaIso.split("-").map(Number) as [number, number, number];
  const cumple18 = new Date(Date.UTC(a + 18, m - 1, d));
  return cumple18.getTime() <= Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
}

/** Datos de identidad para la verificación. El documento se guarda cifrado con su huella (regla 1). Solo en borrador. */
export async function guardarIdentidad(proveedor: { id: string; estado: string }, formData: FormData): Promise<Resultado> {
  if (proveedor.estado !== "borrador") return { error: "Tu perfil ya fue enviado: para cambiar tus datos de identidad escríbenos." };
  const r = esquemaIdentidad.safeParse(Object.fromEntries(formData));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };
  if (!esMayorDeEdad(r.data.fechaNacimiento)) return { error: "Debes ser mayor de edad para registrarte como proveedor." };
  await db
    .update(proveedores)
    .set({
      tipoDocumento: r.data.tipoDocumento,
      ...protegerDocumento(r.data.documento),
      direccionNotificaciones: r.data.direccionNotificaciones || null,
      fechaNacimiento: r.data.fechaNacimiento,
      ...(r.data.numeroMatricula !== undefined ? { numeroMatricula: r.data.numeroMatricula || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(proveedores.id, proveedor.id));
  await registrarEvento(proveedor.id, "cambios", { campos: ["documento de identidad", "dirección", "fecha de nacimiento", ...(r.data.numeroMatricula ? ["n.º de matrícula"] : [])] });
  return { ok: true };
}

/** A dónde va un borrador que abre una de las pantallas antiguas del alta: a la página única, conservando el aviso (ok/error/bienvenida). */
export function rutaAlta(sp: Record<string, string | undefined>): string {
  const q = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => (e[0] === "ok" || e[0] === "error" || e[0] === "bienvenida" || e[0] === "ajustar") && Boolean(e[1])));
  return `/panel/alta${q.size ? `?${q}` : ""}`;
}

/** 573001234567 → «300 123 4567» para mostrarlo en el campo. */
export function whatsappParaCampo(v: string): string {
  const d = v.replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("57") ? d.slice(2) : d;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : v;
}
