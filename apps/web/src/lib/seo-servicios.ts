/**
 * SEO de las páginas por oficio: títulos (≤ 60), descripciones (140–155), introducciones y preguntas frecuentes.
 * Todo el texto sale de los datos del oficio (packages/shared/src/categorias.ts); nada se inventa:
 * las respuestas de precio usan solo datos reales y únicamente con 5 o más proveedores con precio.
 */
import type { Subcategoria } from "@las3b/shared";
import type { Pregunta } from "@/lib/faqs";

export type Variante = "base" | "localidad" | "urgente" | "economico";

const MARCA = "| LasTresB";
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sinBogota = (principal: string) => principal.replace(/ en Bogotá$/i, "");

/** Texto que cierra la línea de título: evita pasar de 60 caracteres. */
function ajustar(opciones: string[]): string {
  const ok = opciones.find((o) => `${o} ${MARCA}`.length <= 60);
  return `${ok ?? opciones[opciones.length - 1]!} ${MARCA}`;
}

const PLURALES_BARATOS = new Set(["trasteos", "fletes"]);

/** Encabezado H1 (y base del title). */
export function h1(sub: Subcategoria, v: Variante, localidad?: string): string {
  const base = sinBogota(sub.seo.principal);
  switch (v) {
    case "localidad":
      return `${mayuscula(base)} en ${localidad} a domicilio`;
    case "urgente":
      return sub.slug === "cerrajero" ? "Cerrajero 24 horas en Bogotá" : `${mayuscula(base)} urgente en Bogotá`;
    case "economico":
      return PLURALES_BARATOS.has(sub.slug) ? `${mayuscula(base)} baratos en Bogotá` : `Precios de ${base} en Bogotá`;
    default:
      return mayuscula(sub.seo.principal);
  }
}

export function titulo(sub: Subcategoria, v: Variante, localidad?: string): string {
  const completo = h1(sub, v, localidad);
  const corto = v === "localidad" ? `${mayuscula(sinBogota(sub.seo.principal))} en ${localidad}` : v === "base" ? `${sub.nombre} en Bogotá` : completo;
  return ajustar([completo, corto, `${sub.nombre} en ${localidad ?? "Bogotá"}`]);
}

/** Descripción de 140 a 155 caracteres con la palabra principal, una búsqueda relacionada y un llamado a la acción. */
export function descripcion(sub: Subcategoria, v: Variante, localidad?: string): string {
  const [r1, r2] = sub.seo.relacionadas;
  const cuerpo: Record<Variante, string> = {
    base: `Encuentra ${sub.seo.principal}: compara reseñas de clientes reales y proveedores verificados.`,
    localidad: `Encuentra ${sinBogota(sub.seo.principal)} en ${localidad}, Bogotá: reseñas reales y proveedores verificados.`,
    urgente: `${h1(sub, v)}: proveedores que declaran atender urgencias, con reseñas reales.`,
    economico: `${h1(sub, v)}: compara el precio desde de proveedores verificados y sus reseñas.`,
  };
  const piezas = [cuerpo[v], r1 ? `También ${r1}${r2 ? ` y ${r2}` : ""}.` : "", "Contacta por WhatsApp, sin comisiones."].filter(Boolean);
  let texto = piezas.join(" ");
  while (texto.length > 155 && piezas.length > 2) {
    piezas.splice(piezas.length - 2, 1);
    texto = piezas.join(" ");
  }
  if (texto.length < 140) texto = `${texto} Gratis para ti.`;
  if (texto.length > 155) texto = `${texto.slice(0, 154).replace(/\s+\S*$/, "")}…`;
  return texto;
}

export function introduccion(sub: Subcategoria, v: Variante, localidad?: string, barrios: string[] = []): string {
  if (v === "localidad" && localidad) {
    const lista = barrios.length ? `${barrios.slice(0, -1).join(", ")} y ${barrios.at(-1)}` : "";
    return `${sub.seo.intro} Esta página reúne a quienes cubren ${localidad}${lista ? `, por ejemplo los barrios ${lista}` : ""}.`;
  }
  if (v === "urgente") {
    return `${sub.seo.intro} Aquí aparecen solo los proveedores que declaran atender urgencias o estar disponibles las 24 horas. LasTresB no presta el servicio ni garantiza tiempos de llegada: confirma la disponibilidad por WhatsApp.`;
  }
  if (v === "economico") {
    return `${sub.seo.intro} Esta lista está ordenada por el «precio desde» que cada proveedor publica. Es un valor orientativo: el precio final lo acuerdas con él antes de empezar.`;
  }
  return sub.seo.intro;
}

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** 3 a 5 preguntas por oficio. La de precio solo usa cifras reales si hay al menos 5 precios publicados. */
export function preguntas(sub: Subcategoria, o: { localidad?: string; precios: number[]; urgente: boolean }): Pregunta[] {
  const nombre = sinBogota(sub.seo.principal);
  const donde = o.localidad ? `${o.localidad}, Bogotá` : "Bogotá";
  const precios = [...o.precios].sort((a, b) => a - b);
  const respuestaPrecio =
    precios.length >= 5
      ? `Los proveedores publicados muestran un «precio desde» entre ${cop.format(precios[0]!)} y ${cop.format(precios.at(-1)!)}. Es orientativo: el valor final depende del trabajo y lo acuerdas con el proveedor antes de empezar.`
      : "Depende del trabajo. Cada proveedor publica un «precio desde» orientativo en su página; el valor final lo acuerdas con él antes de empezar. Pide la cotización por escrito.";
  const lista: Pregunta[] = [
    { pregunta: `¿Cuánto cuesta ${nombre} en ${donde}?`, respuesta: respuestaPrecio },
    { pregunta: `¿Cómo elijo ${nombre} de confianza?`, respuesta: "Mira las reseñas de clientes reales, las insignias de verificación y las fotos de trabajos de cada perfil, y escríbeles por WhatsApp para comparar cotizaciones. Nuestra guía «Cómo saber si un proveedor es confiable» te da más señales." },
  ];
  if (sub.seo.problemas.length) {
    lista.push({ pregunta: `¿Qué problemas resuelve el servicio de ${nombre}?`, respuesta: `Los más comunes: ${sub.seo.problemas.map((p) => p.toLowerCase()).join(", ")}.` });
  }
  if (sub.atiendeUrgencias) {
    lista.push({ pregunta: `¿Hay ${nombre} que atiendan urgencias?`, respuesta: "Algunos proveedores declaran atender urgencias el mismo día o las 24 horas, y lo muestran en una etiqueta. LasTresB no presta el servicio ni garantiza tiempos de llegada: confirma la disponibilidad por WhatsApp." });
  }
  lista.push({ pregunta: "¿Cómo contacto al proveedor?", respuesta: "Pulsa «Contactar por WA» en su tarjeta o perfil y acuerdan precio y fecha directo. Es gratis y sin comisiones." });
  return lista.slice(0, 5);
}

/** Aviso fijo de la página urgente de gas. Es solo una indicación de seguridad: LasTresB no publica números de servicios públicos. */
export const AVISO_GAS = "Si hueles gas, sal del lugar, no enciendas luces y llama a la línea de emergencias de tu empresa de gas.";
