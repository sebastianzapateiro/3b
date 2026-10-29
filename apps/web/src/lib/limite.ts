/** Antispam sencillo en memoria: máximo `max` envíos por clave (por ejemplo la IP) en la ventana. Protege cada instancia del servidor. */
const REGISTRO = new Map<string, number[]>();

export function excedeLimite(clave: string | null, max = 5, ventanaMs = 3_600_000): boolean {
  if (!clave) return false;
  const ahora = Date.now();
  const recientes = (REGISTRO.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  recientes.push(ahora);
  REGISTRO.set(clave, recientes);
  return recientes.length > max;
}