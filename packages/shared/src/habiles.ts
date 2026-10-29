/**
 * CU-92 · Días hábiles de Colombia. Calcula los festivos oficiales de cualquier año (Ley 51 de 1983, «Ley Emiliani»):
 * fijos, trasladados al lunes siguiente y los que dependen de la Semana Santa. Sirve para los plazos legales
 * (Ley 1581: 10 y 15 días hábiles; Ley 1480: reclamos de consumo).
 */

const iso = (d: Date) => d.toISOString().slice(0, 10);
const sumar = (d: Date, dias: number) => new Date(d.getTime() + dias * 86_400_000);

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher), en UTC. */
function pascua(anio: number): Date {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Si la fecha no cae lunes, pasa al lunes siguiente. */
function aLunes(d: Date): Date {
  const dia = d.getUTCDay();
  return dia === 1 ? d : sumar(d, (8 - dia) % 7);
}

const cache = new Map<number, Set<string>>();

export function festivosColombia(anio: number): Set<string> {
  const guardado = cache.get(anio);
  if (guardado) return guardado;
  const f = (m: number, d: number) => new Date(Date.UTC(anio, m - 1, d));
  const p = pascua(anio);
  const lista = [
    // Fijos
    f(1, 1), f(5, 1), f(7, 20), f(8, 7), f(12, 8), f(12, 25),
    // Trasladados al lunes
    aLunes(f(1, 6)), aLunes(f(3, 19)), aLunes(f(6, 29)), aLunes(f(8, 15)), aLunes(f(10, 12)), aLunes(f(11, 1)), aLunes(f(11, 11)),
    // Semana Santa y los que dependen de ella
    sumar(p, -3), sumar(p, -2), sumar(p, 43), sumar(p, 64), sumar(p, 71),
  ].map(iso);
  const set = new Set(lista);
  cache.set(anio, set);
  return set;
}

export function esDiaHabil(d: Date, extra: ReadonlySet<string> = new Set()): boolean {
  const dia = d.getUTCDay();
  if (dia === 0 || dia === 6) return false;
  const clave = iso(d);
  return !festivosColombia(d.getUTCFullYear()).has(clave) && !extra.has(clave);
}

/** Suma `dias` días hábiles a una fecha (el día de partida no cuenta). Devuelve AAAA-MM-DD. */
export function sumarDiasHabilesColombia(desde: Date, dias: number, extra: ReadonlySet<string> = new Set()): string {
  const d = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate()));
  let restantes = dias;
  while (restantes > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (esDiaHabil(d, extra)) restantes--;
  }
  return iso(d);
}

/** Días hábiles transcurridos entre dos fechas (sin contar la de inicio, contando la final). */
export function diasHabilesEntre(desde: Date, hasta: Date, extra: ReadonlySet<string> = new Set()): number {
  const d = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate()));
  const fin = Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), hasta.getUTCDate());
  let n = 0;
  while (d.getTime() < fin) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (esDiaHabil(d, extra)) n++;
  }
  return n;
}
