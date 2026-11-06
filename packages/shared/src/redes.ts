/**
 * Redes sociales del proveedor (P7, P8): las define el proveedor (o el equipo) y se muestran en su página pública.
 * Se aceptan como «@usuario», «usuario» o un enlace; siempre se guardan como un enlace https limpio y del dominio de esa red
 * (sin parámetros de seguimiento, sin usuario ni clave en la URL). Sin dependencias de Node: lo usan web y app móvil.
 */

/** `URL` existe en el navegador, en Node y en Expo; este paquete no incluye esos tipos, así que se declara lo mínimo que se usa. */
declare class URL {
  constructor(url: string);
  protocol: string;
  username: string;
  password: string;
  port: string;
  hostname: string;
  pathname: string;
}

export const REDES = [
  { clave: "instagram", nombre: "Instagram", dominios: ["instagram.com"], base: "https://www.instagram.com/", ejemplo: "@tunegocio" },
  { clave: "facebook", nombre: "Facebook", dominios: ["facebook.com", "fb.com"], base: "https://www.facebook.com/", ejemplo: "tunegocio o enlace de tu página" },
  { clave: "tiktok", nombre: "TikTok", dominios: ["tiktok.com"], base: "https://www.tiktok.com/@", ejemplo: "@tunegocio" },
  { clave: "youtube", nombre: "YouTube", dominios: ["youtube.com", "youtu.be"], base: "https://www.youtube.com/@", ejemplo: "@tucanal o enlace de tu canal" },
  { clave: "web", nombre: "Sitio web", dominios: null, base: "", ejemplo: "www.tusitio.com" },
] as const;

export type ClaveRed = (typeof REDES)[number]["clave"];
export type RedesSociales = Partial<Record<ClaveRed, string>>;

const USUARIO = /^[A-Za-z0-9._-]{2,60}$/;
const MAX_URL = 200;

const sinWww = (host: string) => host.toLowerCase().replace(/^www\./, "");
/** IP o «localhost»: nunca es el sitio de un negocio. */
const esDireccionInterna = (host: string) => host === "localhost" || /^[\d.]+$/.test(host) || host.includes(":") || !host.includes(".");

/**
 * Normaliza lo que escribió la persona a un enlace https de esa red. Devuelve "" si lo dejó vacío y `null` si no es válido
 * (otra red, un enlace raro o texto que no parece un usuario).
 */
export function normalizarRed(clave: ClaveRed, crudo: string): string | null {
  const red = REDES.find((r) => r.clave === clave);
  const v = crudo.trim();
  if (!red) return null;
  if (v === "") return "";
  if (v.length > MAX_URL) return null;

  // Usuario suelto («@tunegocio», «tunegocio» o «mi.negocio»): se arma el enlace de la red. Es un enlace si trae «/» o el dominio de la red.
  const pareceEnlace = v.includes("/") || (red.dominios?.some((d) => v.toLowerCase().includes(d)) ?? true);
  if (red.dominios && !pareceEnlace) {
    const usuario = v.replace(/^@/, "");
    return USUARIO.test(usuario) ? `${red.base}${usuario}` : null;
  }

  // Enlace: sin esquema se asume https; http se pasa a https.
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;
  const host = sinWww(url.hostname);
  if (red.dominios) {
    if (!red.dominios.some((d) => host === d || host.endsWith(`.${d}`))) return null;
  } else if (esDireccionInterna(host)) {
    return null;
  }
  const ruta = url.pathname.replace(/\/+$/, "");
  return `https://${url.hostname.toLowerCase()}${ruta}`;
}

/**
 * Lee las redes de un formulario (campos `red_instagram`, `red_facebook`…). Devuelve las válidas y, si una no lo es, el mensaje para la persona.
 */
export function redesDesdeFormulario(campo: (nombre: string) => string): { redes: RedesSociales; error?: string } {
  const redes: RedesSociales = {};
  for (const r of REDES) {
    const n = normalizarRed(r.clave, campo(`red_${r.clave}`));
    if (n === null) return { redes: {}, error: `Revisa el enlace de ${r.nombre}: escribe tu usuario o el enlace de ${r.dominios ? "esa red" : "tu sitio"}.` };
    if (n) redes[r.clave] = n;
  }
  return { redes };
}

/** Lo guardado en la base, a salvo: solo claves conocidas y enlaces que siguen siendo válidos. */
export function redesDesdeBase(v: unknown): RedesSociales {
  const salida: RedesSociales = {};
  if (!v || typeof v !== "object") return salida;
  for (const r of REDES) {
    const valor = (v as Record<string, unknown>)[r.clave];
    if (typeof valor !== "string") continue;
    const n = normalizarRed(r.clave, valor);
    if (n) salida[r.clave] = n;
  }
  return salida;
}
