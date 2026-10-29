/**
 * P3 / B1 · Supabase Storage por su API REST, solo desde el servidor (regla 2).
 * Buckets: `privado` (sin políticas: solo la service role) y `publico`.
 * El navegador nunca recibe la service role: sube con una URL firmada de un solo uso.
 */

export type Bucket = "privado" | "publico";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  return { base: `${url}/storage/v1`, cabeceras: { apikey: clave, Authorization: `Bearer ${clave}` } };
}

const ruta = (bucket: Bucket, camino: string) => `${bucket}/${camino.split("/").map(encodeURIComponent).join("/")}`;

/** URL para que el navegador suba un archivo con PUT. Sirve una sola vez; el bucket aplica tipo y tamaño máximos. */
export async function firmarSubida(bucket: Bucket, camino: string): Promise<string> {
  const { base, cabeceras } = config();
  const r = await fetch(`${base}/object/upload/sign/${ruta(bucket, camino)}`, { method: "POST", headers: cabeceras });
  if (!r.ok) throw new Error(`Storage: no se pudo firmar la subida (${r.status}).`);
  const { url } = (await r.json()) as { url: string };
  return `${base}${url}`;
}

/** Tamaño y tipo declarados del objeto, o null si no existe. */
export async function infoObjeto(bucket: Bucket, camino: string): Promise<{ bytes: number; mime: string } | null> {
  const { base, cabeceras } = config();
  const r = await fetch(`${base}/object/info/${ruta(bucket, camino)}`, { headers: cabeceras, cache: "no-store" });
  if (r.status === 400 || r.status === 404) return null;
  if (!r.ok) throw new Error(`Storage: no se pudo leer el objeto (${r.status}).`);
  const i = (await r.json()) as { size: number; content_type: string };
  return { bytes: i.size, mime: i.content_type };
}

/** Primeros `n` bytes del objeto: bastan para reconocer su tipo real. */
export async function leerInicio(bucket: Bucket, camino: string, n = 16): Promise<Uint8Array> {
  const { base, cabeceras } = config();
  const r = await fetch(`${base}/object/${ruta(bucket, camino)}`, { headers: { ...cabeceras, Range: `bytes=0-${n - 1}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`Storage: no se pudo leer el objeto (${r.status}).`);
  return new Uint8Array(await r.arrayBuffer()).subarray(0, n);
}

/** URL de lectura temporal. Para `privado`, cada llamada debe quedar en la auditoría. */
export async function urlFirmada(bucket: Bucket, camino: string, segundos: number): Promise<string> {
  const { base, cabeceras } = config();
  const r = await fetch(`${base}/object/sign/${ruta(bucket, camino)}`, {
    method: "POST",
    headers: { ...cabeceras, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: segundos }),
  });
  if (!r.ok) throw new Error(`Storage: no se pudo firmar la lectura (${r.status}).`);
  const { signedURL } = (await r.json()) as { signedURL: string };
  return `${base}${signedURL}`;
}

export async function borrarObjetos(bucket: Bucket, caminos: string[]) {
  if (caminos.length === 0) return;
  const { base, cabeceras } = config();
  const r = await fetch(`${base}/object/${bucket}`, {
    method: "DELETE",
    headers: { ...cabeceras, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: caminos }),
  });
  if (!r.ok) console.error(`[almacenamiento] No se pudieron borrar ${caminos.length} objetos (${r.status}).`);
}
