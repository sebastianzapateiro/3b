/**
 * Semillas: 20 localidades, taxonomía inicial, insignias y políticas borrador.
 * Fuente: "Catálogo y especificación de casos de uso", sección 5.7 (diccionario de búsqueda).
 * Uso: pnpm db:seed (idempotente: no duplica si ya existen).
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { aMarkdown, CATEGORIAS, LOCALIDADES_BOGOTA, PARAMETROS, POLITICAS_VERSIONADAS } from "@las3b/shared";

const INSIGNIAS = [
  { clave: "verificado", nombre: "Verificado", vigenciaMeses: null },
  { clave: "formalizado", nombre: "Formalizado", vigenciaMeses: 12 },
  { clave: "apto_menores", nombre: "Apto para menores", vigenciaMeses: 6 },
  { clave: "certificado", nombre: "Certificado en su oficio", vigenciaMeses: 12 },
];

/** Textos de políticas iniciales (RF-19). Reemplazar por los textos definitivos del Drive ("Textos legales"). */
const POLITICAS_BORRADOR = [
  {
    tipo: "terminos_compradores",
    version: "1.0",
    contenidoMd:
      "# Términos de uso (compradores)\n\n**Versión 1.0 — Vigencia: 27 de octubre de 2026.**\n\n## 1. Objeto\n\nLasTresB es un directorio y plataforma de contacto gratuito. El comprador describe un servicio u oficio y contacta al proveedor por WhatsApp; el servicio, el precio, la fecha y las garantías se acuerdan entre el proveedor y el comprador.\n\n## 2. Exención de responsabilidad\n\nLasTresB es una plataforma de tráfico que verifica datos básicos para la inscripción (mayoría de edad, consentimientos). Queda exonerada de responsabilidad por la prestación del servicio, por defectos, riesgos, garantías o incumplimientos ocurridos tras el contacto. La responsabilidad civil y la conversación contractual son entre el proveedor y el cliente; LasTresB no interviene en pagos, no cobra comisiones, no es intermediario de pagos, empleador ni garante.\n\n## 3. Elegibilidad\n\nEl servicio está dirigido a personas mayores de 18 años con capacidad legal para contratar.\n\nAl registrarse en LasTresB se aceptan estos términos.",
    esencial: true,
  },
  {
    tipo: "tratamiento_datos",
    version: "1.0",
    contenidoMd:
      "# Tratamiento de datos personales\n\n**Versión 1.0 — Vigencia: 27 de octubre de 2026.**\n\n## 1. Datos que tratamos\n\nDatos de la cuenta (nombre, correo, datos de verificación y consentimientos) y datos privados de proveedores (documento cifrado, dirección de notificaciones, RUT, fecha de nacimiento) que no salen del portafolio público.\n\n## 2. Consentimientos\n\nAl registrarse se requiere casilla no premarcada de mayoría de edad y aceptación de los términos y el tratamiento de datos; se guarda versión, fecha e IP.\n\n## 3. Conservación y derechos\n\nConsultas, rectificaciones, supresiones o exportaciones conforme a la Ley 1581 de 2012.\n\n## 4. Reseñas\n\nUna reseña por contacto y solo con un clic previo; se conservan bloqueadas 5 años tras eliminar la cuenta.",
    esencial: true,
  },
] as const;

async function main() {
  const { db, consultar } = await import("./index");
  const { categorias, configuracion, localidades, terminosBusqueda, insignias, politicas } = await import("./schema/index");
  const { eq, sql } = await import("drizzle-orm");

  await db
    .insert(localidades)
    .values(LOCALIDADES_BOGOTA.map((l) => ({ numero: l.numero, nombre: l.nombre, slug: l.slug })))
    .onConflictDoNothing({ target: localidades.slug });

  await db.insert(insignias).values(INSIGNIAS).onConflictDoNothing({ target: insignias.clave });

  let orden = 0;
  const slugsVigentes: string[] = [];
  for (const { nombre, slug, icono, subcategorias } of CATEGORIAS) {
    slugsVigentes.push(slug);
    const [padre] = await db
      .insert(categorias)
      .values({ nombre, slug, icono, orden: orden++ })
      .onConflictDoUpdate({ target: categorias.slug, set: { nombre, icono, activa: true } })
      .returning({ id: categorias.id });

    for (const [i, sub] of subcategorias.entries()) {
      slugsVigentes.push(sub.slug);
      const datos = {
        padreId: padre!.id,
        nombre: sub.nombre,
        orden: i,
        exigeInsigniaMenores: sub.exigeInsigniaMenores,
        exigeRutDesdeAlta: sub.exigeRutDesdeAlta,
        popular: sub.popular,
        atiendeUrgencias: sub.atiendeUrgencias,
        subgrupo: sub.subgrupo ?? null,
        activa: true,
      };
      const [hija] = await db
        .insert(categorias)
        .values({ slug: sub.slug, ...datos })
        .onConflictDoUpdate({ target: categorias.slug, set: datos })
        .returning({ id: categorias.id });

      // Los sinónimos se reemplazan por completo para que no queden términos viejos (p. ej. de oficios que ya no existen).
      const terminos = [sub.nombre, ...sub.claves.split(",")].map((t) => t.trim().toLowerCase()).filter(Boolean);
      await db.delete(terminosBusqueda).where(eq(terminosBusqueda.categoriaId, hija!.id));
      await db.insert(terminosBusqueda).values([...new Set(terminos)].map((termino) => ({ termino, categoriaId: hija!.id })));
    }
  }

  // Limpieza: categorías que ya no existen en la taxonomía (p. ej. «Cuidado de personas», que LasTresB no ofrece).
  // Se borran si nada las usa; si tienen proveedores, servicios o contactos se desactivan y se avisa.
  const todas = await db.select({ id: categorias.id, slug: categorias.slug, padreId: categorias.padreId }).from(categorias);
  const obsoletas = todas.filter((c) => !slugsVigentes.includes(c.slug)).sort((a, b) => Number(b.padreId !== null) - Number(a.padreId !== null));
  for (const c of obsoletas) {
    const [uso] = (await consultar(sql`SELECT
      (SELECT count(*)::int FROM proveedor_categorias WHERE categoria_id = ${c.id}) +
      (SELECT count(*)::int FROM servicios_proveedor WHERE categoria_id = ${c.id}) +
      (SELECT count(*)::int FROM contactos WHERE categoria_id = ${c.id}) +
      (SELECT count(*)::int FROM categorias WHERE padre_id = ${c.id}) AS n`)) as unknown as { n: number }[];
    if ((uso?.n ?? 0) === 0) {
      await db.delete(categorias).where(eq(categorias.id, c.id));
      console.log(`Categoría eliminada: ${c.slug}`);
    } else {
      await db.update(categorias).set({ activa: false }).where(eq(categorias.id, c.id));
      console.warn(`ATENCIÓN: ${c.slug} tiene datos asociados; quedó desactivada. Revísala a mano.`);
    }
  }

  // Parámetros configurables (regla 8): solo se crean si no existen, para no pisar cambios hechos en el backoffice.
  await db
    .insert(configuracion)
    .values(PARAMETROS.filter((p) => p.defecto !== null).map((p) => ({ clave: p.clave, valor: p.defecto })))
    .onConflictDoNothing({ target: configuracion.clave });
  // Políticas versionadas (fuente: packages/shared/src/politicas.ts). Se inserta cada versión que aún no exista.
  const existentes = await db.select({ tipo: politicas.tipo, version: politicas.version }).from(politicas);
  for (const p of [...POLITICAS_BORRADOR.filter((b) => !POLITICAS_VERSIONADAS.some((v) => v.tipo === b.tipo)), ...POLITICAS_VERSIONADAS]) {
    if (existentes.some((e) => e.tipo === p.tipo && e.version === p.version)) continue;
    const contenidoMd = "secciones" in p ? aMarkdown(p) : p.contenidoMd;
    await db.insert(politicas).values({
      tipo: p.tipo as NonNullable<typeof p.tipo>,
      version: p.version,
      contenidoMd,
      esencial: true,
      vigenteDesde: "vigenteDesde" in p ? new Date(p.vigenteDesde) : new Date(),
    });
  }
  console.log("Semillas cargadas: localidades, insignias, taxonomía y políticas.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
