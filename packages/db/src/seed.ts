/**
 * Semillas: 20 localidades, taxonomía inicial, insignias y políticas borrador.
 * Fuente: "Catálogo y especificación de casos de uso", sección 5.7 (diccionario de búsqueda).
 * Uso: pnpm db:seed (idempotente: no duplica si ya existen).
 */
import { config } from "dotenv";
config({ path: "../../.env" });

import { LOCALIDADES_BOGOTA, sugerirSlug } from "@las3b/shared";

type Sub = { nombre: string; claves: string; menores?: boolean; rut?: boolean };

const TAXONOMIA: Record<string, { icono: string; subs: Sub[] }> = {
  Hogar: {
    icono: "casa",
    subs: [
      { nombre: "Plomería", claves: "plomero, fontanero, tubería, cañería, destape, fuga, goteo, sanitario, inodoro, lavaplatos, grifería, llave, lavado de tanques" },
      { nombre: "Electricidad", claves: "electricista, corto, cortocircuito, toma, enchufe, tacos, breaker, cableado, lámparas, instalación eléctrica", rut: true },
      { nombre: "Gas", claves: "gasodomésticos, instalación de gas, calentador a gas, estufa a gas, fuga de gas", rut: true },
      { nombre: "Electrodomésticos", claves: "técnico de neveras, nevera, nevecón, congelador, lavadora, secadora, centro de lavado, estufa, horno, microondas, campana extractora, lavavajillas, calentador, aire acondicionado" },
      { nombre: "Instalaciones y montajes", claves: "taladro, perforar, colgar cuadros, repisas, soporte de TV, cortinas, persianas, instalar lámparas, armar muebles, instalar electrodomésticos" },
      { nombre: "Pintura y acabados", claves: "pintor, pintar, estuco, resane, fachada, drywall, cielo raso" },
      { nombre: "Construcción y remodelación", claves: "maestro de obra, albañil, enchape, baldosa, piso, remodelación, cocina integral", rut: true },
      { nombre: "Techos e impermeabilización", claves: "goteras, tejas, canales, impermeabilizar, humedad, filtraciones", rut: true },
      { nombre: "Vidrios y ventanería", claves: "vidriero, vidrio, ventana, espejo, división de baño, ventanal" },
      { nombre: "Soldadura y ornamentación", claves: "soldador, rejas, puertas metálicas, pasamanos, estructuras", rut: true },
      { nombre: "Carpintería", claves: "carpintero, ebanista, muebles, clóset, puertas, cocina" },
      { nombre: "Cerrajería", claves: "cerrajero, chapa, cerradura, llaves, abrir puerta, guarda" },
      { nombre: "Seguridad", claves: "cámaras de seguridad, citófono, alarma, cerca eléctrica, CCTV" },
      { nombre: "Aseo y limpieza", claves: "aseo, limpieza, empleada por días, lavado de muebles, tapicería, alfombras, colchones" },
      { nombre: "Fumigación", claves: "fumigar, cucarachas, ratones, roedores, termitas, plagas", rut: true },
      { nombre: "Jardinería", claves: "jardinero, poda, césped, pasto, plantas" },
    ],
  },
  "Clases y refuerzo": {
    icono: "libro",
    subs: [
      { nombre: "Refuerzo escolar", claves: "tareas, nivelación, profesor particular, tutor, primaria, bachillerato", menores: true },
      { nombre: "Matemáticas y ciencias", claves: "álgebra, cálculo, física, química", menores: true },
      { nombre: "Idiomas", claves: "inglés, francés, conversación, TOEFL, IELTS", menores: true },
      { nombre: "Preicfes", claves: "ICFES, Saber 11, preuniversitario", menores: true },
      { nombre: "Música", claves: "guitarra, piano, canto, violín, batería", menores: true },
    ],
  },
  Acarreos: {
    icono: "camion",
    subs: [{ nombre: "Trasteos y mudanzas", claves: "trasteo, mudanza, acarreo, camión, furgón, flete, carga, embalaje" }],
  },
  "Servicios varios": {
    icono: "herramienta",
    subs: [
      { nombre: "Tecnología", claves: "técnico de computadores, formatear, wifi, redes, impresora, celular" },
      { nombre: "Belleza a domicilio", claves: "manicure, pedicure, peluquería, barbero, uñas, maquillaje" },
      { nombre: "Mascotas", claves: "paseador de perros, peluquería canina, adiestrador, guardería" },
      { nombre: "Cuidado de personas", claves: "niñera, cuidadora, enfermera a domicilio, adulto mayor", menores: true, rut: true },
    ],
  },
};

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
  for (const [nombre, { icono, subs }] of Object.entries(TAXONOMIA)) {
    const [padre] = await db
      .insert(categorias)
      .values({ nombre, slug: sugerirSlug(nombre), icono, orden: orden++ })
      .onConflictDoUpdate({ target: categorias.slug, set: { nombre } })
      .returning({ id: categorias.id });

    for (const [i, sub] of subs.entries()) {
      const [hija] = await db
        .insert(categorias)
        .values({
          padreId: padre!.id,
          nombre: sub.nombre,
          slug: sugerirSlug(sub.nombre),
          orden: i,
          exigeInsigniaMenores: sub.menores ?? false,
          exigeRutDesdeAlta: sub.rut ?? false,
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

  for (const p of POLITICAS_BORRADOR) {
    const existe = await db.select({ id: politicas.id }).from(politicas).where(eq(politicas.tipo, p.tipo)).limit(1);
    if (existe.length === 0) {
      await db.insert(politicas).values({
        ...p,
        contenidoMd: "Texto pendiente: ver carpeta \"Textos legales\" del Drive.",
        esencial: true,
        vigenteDesde: new Date(),
      });
    }
  }

  console.log("Semillas cargadas: localidades, insignias, taxonomía y políticas.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
