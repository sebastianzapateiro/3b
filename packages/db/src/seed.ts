/**
 * Semillas: 20 localidades, taxonomía inicial, insignias y políticas borrador.
 * Fuente: "Catálogo y especificación de casos de uso", sección 5.7 (diccionario de búsqueda).
 * Uso: pnpm db:seed (idempotente: no duplica si ya existen).
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { aMarkdown, CATEGORIAS, LOCALIDADES_BOGOTA, POLITICAS_VERSIONADAS } from "@las3b/shared";

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
      "# Términos de uso (compradores)\n\n**Versión 1.0 — Vigencia: 27 de octubre de 2026.**\n\n## 1. Objeto\n\nLas 3B es un directorio y plataforma de contacto gratuito. El comprador describe un servicio u oficio y contacta al proveedor por WhatsApp; el servicio, el precio, la fecha y las garantías se acuerdan entre el proveedor y el comprador.\n\n## 2. Exención de responsabilidad\n\nLas 3B es una plataforma de tráfico que verifica datos básicos para la inscripción (mayoría de edad, consentimientos). Queda exonerada de responsabilidad por la prestación del servicio, por defectos, riesgos, garantías o incumplimientos ocurridos tras el contacto. La responsabilidad civil y la conversación contractual son entre el proveedor y el cliente; Las 3B no interviene en pagos, no cobra comisiones, no es intermediario de pagos, empleador ni garante.\n\n## 3. Elegibilidad\n\nEl servicio está dirigido a personas mayores de 18 años con capacidad legal para contratar.\n\nAl registrarse en Las 3B se aceptan estos términos.",
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
  const { db } = await import("./index");
  const { categorias, localidades, terminosBusqueda, insignias, politicas } = await import("./schema/index");
  const { eq } = await import("drizzle-orm");

  await db
    .insert(localidades)
    .values(LOCALIDADES_BOGOTA.map((l) => ({ numero: l.numero, nombre: l.nombre, slug: l.slug })))
    .onConflictDoNothing({ target: localidades.slug });

  await db.insert(insignias).values(INSIGNIAS).onConflictDoNothing({ target: insignias.clave });

  let orden = 0;
  for (const { nombre, slug, icono, subcategorias } of CATEGORIAS) {
    const [padre] = await db
      .insert(categorias)
      .values({ nombre, slug, icono, orden: orden++ })
      .onConflictDoUpdate({ target: categorias.slug, set: { nombre } })
      .returning({ id: categorias.id });

    for (const [i, sub] of subcategorias.entries()) {
      const [hija] = await db
        .insert(categorias)
        .values({
          padreId: padre!.id,
          nombre: sub.nombre,
          slug: sub.slug,
          orden: i,
          exigeInsigniaMenores: sub.exigeInsigniaMenores,
          exigeRutDesdeAlta: sub.exigeRutDesdeAlta,
        })
        .onConflictDoUpdate({ target: categorias.slug, set: { nombre: sub.nombre } })
        .returning({ id: categorias.id });

      const terminos = [sub.nombre, ...sub.claves.split(",")].map((t) => t.trim().toLowerCase()).filter(Boolean);
      await db
        .insert(terminosBusqueda)
        .values([...new Set(terminos)].map((termino) => ({ termino, categoriaId: hija!.id })))
        .onConflictDoNothing();
    }
  }

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
