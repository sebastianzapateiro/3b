/**
 * P3 / B1 · Cifrado de datos privados del proveedor (regla 1, Ley 1581). Solo servidor.
 * AES-256-GCM con clave derivada de DOCUMENTOS_CLAVE (HKDF); formato `v1:<iv>:<cifrado+tag>` en base64url.
 * `huella()` es un HMAC-SHA256 determinista para buscar duplicados sin descifrar.
 * El prefijo de versión permite rotar la clave más adelante sin perder datos.
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

const VERSION = "v1";

let claves: { cifrado: Buffer; huella: Buffer } | null = null;

function obtenerClaves() {
  if (claves) return claves;
  const base = process.env.DOCUMENTOS_CLAVE;
  if (!base) throw new Error("Falta DOCUMENTOS_CLAVE: no se pueden cifrar ni leer documentos.");
  const maestra = Buffer.from(base, "base64");
  if (maestra.length < 32) throw new Error("DOCUMENTOS_CLAVE debe tener al menos 32 bytes (openssl rand -base64 32).");
  const derivar = (uso: string) => Buffer.from(hkdfSync("sha256", maestra, Buffer.alloc(0), `lastresb:${uso}:${VERSION}`, 32));
  claves = { cifrado: derivar("cifrado"), huella: derivar("huella") };
  return claves;
}

export function estaCifrado(valor: string | null | undefined): boolean {
  return Boolean(valor?.startsWith(`${VERSION}:`));
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", obtenerClaves().cifrado, iv);
  const datos = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final(), cifrador.getAuthTag()]);
  return `${VERSION}:${iv.toString("base64url")}:${datos.toString("base64url")}`;
}

/** Lanza error si el valor fue alterado o la clave no corresponde (GCM autentica). */
export function descifrar(valor: string): string {
  const [version, iv, datos] = valor.split(":");
  if (version !== VERSION || !iv || !datos) throw new Error("Formato de dato cifrado no reconocido.");
  const bytes = Buffer.from(datos, "base64url");
  const descifrador = createDecipheriv("aes-256-gcm", obtenerClaves().cifrado, Buffer.from(iv, "base64url"));
  descifrador.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([descifrador.update(bytes.subarray(0, -16)), descifrador.final()]).toString("utf8");
}

/** Documento normalizado (solo dígitos y letras, mayúsculas) → HMAC. Misma entrada, misma huella. */
export function huella(documento: string): string {
  const normal = documento.replace(/[^0-9a-z]/gi, "").toUpperCase();
  return createHmac("sha256", obtenerClaves().huella).update(normal).digest("base64url");
}

/** Cifra el documento y calcula su huella, listo para guardar en `proveedores`. */
export function protegerDocumento(documento: string) {
  return { documentoCifrado: cifrar(documento), documentoHuella: huella(documento) };
}
