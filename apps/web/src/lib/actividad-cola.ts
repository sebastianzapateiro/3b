/**
 * Cola de avisos de actividad de proveedores (B1 / CU-30 / CU-51): lógica pura, sin base de datos ni correo,
 * para poder probarla. La parte con base de datos está en `actividad.ts`.
 *
 * - El primer evento de un proveedor (creación) sale de inmediato.
 * - Los cambios posteriores se agrupan: salen en UN solo correo cuando el más antiguo cumple la ventana (5 min por defecto).
 * - Reintentos con espera creciente (1, 2, 4, 8 y 16 minutos; máximo 5).
 */
export type TipoEvento = "creado" | "registro_completado" | "cambios" | "archivo" | "estado";

export const ETIQUETA_EVENTO: Record<TipoEvento, string> = {
  creado: "Proveedor creado",
  registro_completado: "Registro completado",
  cambios: "Datos guardados",
  archivo: "Archivo subido",
  estado: "Cambio de estado",
};

export type EventoCola = {
  id: string;
  proveedorId: string;
  tipo: TipoEvento;
  campos: string[];
  detalle: string | null;
  creadoEn: Date;
  intentos: number;
  proximoIntento: Date;
};

export type GrupoEnvio = { proveedorId: string; eventos: EventoCola[] };

export const MAX_INTENTOS = 5;
const MINUTO = 60_000;

/** Ventana de agrupación en milisegundos (variable NOTIFY_WINDOW_MINUTES; 5 por defecto). */
export function ventanaMs(env: Record<string, string | undefined> = process.env): number {
  const crudo = env.NOTIFY_WINDOW_MINUTES;
  const n = crudo === undefined || crudo.trim() === "" ? 5 : Number(crudo);
  return (Number.isFinite(n) && n >= 0 ? n : 5) * MINUTO;
}

/** NOTIFY_PROVIDER_EVENTS=false lo apaga todo; cualquier otro valor (o ausente) lo deja encendido. */
export const notificacionesActivas = (env: Record<string, string | undefined> = process.env) => env.NOTIFY_PROVIDER_EVENTS !== "false";

/** Espera antes del siguiente intento: 1, 2, 4, 8, 16 minutos. */
export const esperaReintento = (intentos: number) => 2 ** Math.max(0, intentos - 1) * MINUTO;

/** Qué grupos de eventos pendientes ya toca enviar. Ignora los que están esperando un reintento o agotaron sus intentos. */
export function gruposListos(pendientes: EventoCola[], ahora: Date, ventana: number): GrupoEnvio[] {
  const porProveedor = new Map<string, EventoCola[]>();
  for (const e of pendientes) {
    if (e.intentos >= MAX_INTENTOS || e.proximoIntento.getTime() > ahora.getTime()) continue;
    porProveedor.set(e.proveedorId, [...(porProveedor.get(e.proveedorId) ?? []), e]);
  }
  const listos: GrupoEnvio[] = [];
  for (const [proveedorId, eventos] of porProveedor) {
    const ordenados = [...eventos].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
    const inmediato = ordenados.some((e) => e.tipo === "creado");
    const vencido = ahora.getTime() - ordenados[0]!.creadoEn.getTime() >= ventana;
    if (inmediato || vencido) listos.push({ proveedorId, eventos: ordenados });
  }
  return listos;
}

/** Acceso a los datos y al correo, inyectado para poder simular en las pruebas. */
export type DepsCola = {
  leerPendientes: () => Promise<EventoCola[]>;
  /** Marca como enviados SOLO los que aún no lo estaban y devuelve esos ids (idempotencia: dos procesos no envían lo mismo). */
  reclamar: (ids: string[], ahora: Date) => Promise<string[]>;
  enviar: (grupo: GrupoEnvio) => Promise<void>;
  /** Devuelve los eventos a la cola con un intento más y su próximo horario. */
  fallo: (ids: string[], error: string, intentos: number, proximo: Date) => Promise<void>;
};

export type ResumenCola = { enviados: number; correos: number; fallidos: number };

/** Un fallo de correo nunca lanza: se reintenta después. */
export async function procesarCola(deps: DepsCola, ahora = new Date(), ventana = ventanaMs()): Promise<ResumenCola> {
  const resumen: ResumenCola = { enviados: 0, correos: 0, fallidos: 0 };
  const pendientes = await deps.leerPendientes();
  for (const g of gruposListos(pendientes, ahora, ventana)) {
    const reclamados = await deps.reclamar(g.eventos.map((e) => e.id), ahora);
    if (reclamados.length === 0) continue;
    const propios = { ...g, eventos: g.eventos.filter((e) => reclamados.includes(e.id)) };
    try {
      await deps.enviar(propios);
      resumen.correos += 1;
      resumen.enviados += reclamados.length;
    } catch (e) {
      const intentos = Math.max(...propios.eventos.map((x) => x.intentos)) + 1;
      await deps.fallo(reclamados, e instanceof Error ? e.message : String(e), intentos, new Date(ahora.getTime() + esperaReintento(intentos)));
      resumen.fallidos += reclamados.length;
    }
  }
  return resumen;
}
