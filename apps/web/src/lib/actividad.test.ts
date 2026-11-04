import { describe, expect, it, vi } from "vitest";
import { armarCorreo, idDeSeguimiento, type DatosAviso } from "./actividad-correo";
import { esperaReintento, gruposListos, MAX_INTENTOS, notificacionesActivas, procesarCola, ventanaMs, type DepsCola, type EventoCola } from "./actividad-cola";

const T0 = new Date("2026-11-04T15:00:00Z");
const min = (n: number) => new Date(T0.getTime() + n * 60_000);
const evento = (o: Partial<EventoCola> & { id: string }): EventoCola => ({ proveedorId: "p1", tipo: "cambios", campos: ["nombre"], detalle: null, creadoEn: T0, intentos: 0, proximoIntento: T0, ...o });
const VENTANA = 5 * 60_000;

describe("agrupación en ventana", () => {
  it("la creación sale de inmediato", () => {
    expect(gruposListos([evento({ id: "a", tipo: "creado" })], T0, VENTANA)).toHaveLength(1);
  });

  it("los cambios esperan la ventana de 5 minutos y salen en UN solo grupo por proveedor", () => {
    const cambios = [evento({ id: "a", creadoEn: min(0) }), evento({ id: "b", creadoEn: min(2), campos: ["zonas"] }), evento({ id: "c", creadoEn: min(4) })];
    expect(gruposListos(cambios, min(4), VENTANA)).toHaveLength(0);
    const listos = gruposListos(cambios, min(5), VENTANA);
    expect(listos).toHaveLength(1);
    expect(listos[0]!.eventos.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("proveedores distintos no se mezclan", () => {
    const g = gruposListos([evento({ id: "a", proveedorId: "p1" }), evento({ id: "b", proveedorId: "p2" })], min(6), VENTANA);
    expect(g.map((x) => x.proveedorId).sort()).toEqual(["p1", "p2"]);
  });

  it("la ventana se configura por variable de entorno", () => {
    expect(ventanaMs({})).toBe(5 * 60_000);
    expect(ventanaMs({ NOTIFY_WINDOW_MINUTES: "2" })).toBe(2 * 60_000);
    expect(ventanaMs({ NOTIFY_WINDOW_MINUTES: "basura" })).toBe(5 * 60_000);
  });

  it("NOTIFY_PROVIDER_EVENTS=false lo apaga todo", () => {
    expect(notificacionesActivas({ NOTIFY_PROVIDER_EVENTS: "false" })).toBe(false);
    expect(notificacionesActivas({ NOTIFY_PROVIDER_EVENTS: "true" })).toBe(true);
    expect(notificacionesActivas({})).toBe(true);
  });
});

/** Cola en memoria: lo mismo que hace la base de datos, sin base de datos. */
function colaEnMemoria(inicial: EventoCola[], enviar: DepsCola["enviar"]) {
  const filas = inicial.map((e) => ({ ...e, enviado: false, error: null as string | null }));
  const deps: DepsCola = {
    leerPendientes: async () => filas.filter((f) => !f.enviado && f.intentos < MAX_INTENTOS),
    reclamar: async (ids) => filas.filter((f) => ids.includes(f.id) && !f.enviado).map((f) => ((f.enviado = true), f.id)),
    enviar,
    fallo: async (ids, error, intentos, proximo) => filas.filter((f) => ids.includes(f.id)).forEach((f) => Object.assign(f, { enviado: false, error, intentos, proximoIntento: proximo })),
  };
  return { filas, deps };
}

describe("procesamiento de la cola", () => {
  it("es idempotente: el mismo evento no produce dos correos aunque corran dos procesos a la vez", async () => {
    const enviar = vi.fn(async () => {});
    const { deps } = colaEnMemoria([evento({ id: "a", tipo: "creado" })], enviar);
    await Promise.all([procesarCola(deps, T0, VENTANA), procesarCola(deps, T0, VENTANA)]);
    expect(enviar).toHaveBeenCalledTimes(1);
    await procesarCola(deps, min(1), VENTANA);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("varios cambios del mismo proveedor salen en un solo correo", async () => {
    const enviar = vi.fn(async () => {});
    const { deps } = colaEnMemoria([evento({ id: "a", creadoEn: min(0) }), evento({ id: "b", creadoEn: min(1) })], enviar);
    const r = await procesarCola(deps, min(6), VENTANA);
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ correos: 1, enviados: 2 });
  });

  it("si el correo falla no lanza, reintenta con espera creciente y se rinde tras 5 intentos", async () => {
    const enviar = vi.fn(async () => {
      throw new Error("SMTP caído");
    });
    const { filas, deps } = colaEnMemoria([evento({ id: "a", tipo: "creado" })], enviar);
    let ahora = T0;
    const esperas: number[] = [];
    for (let i = 1; i <= MAX_INTENTOS + 2; i++) {
      await expect(procesarCola(deps, ahora, VENTANA)).resolves.toBeDefined();
      if (filas[0]!.intentos < MAX_INTENTOS) esperas.push(filas[0]!.proximoIntento.getTime() - ahora.getTime());
      ahora = new Date(filas[0]!.proximoIntento.getTime() + 1);
    }
    expect(enviar).toHaveBeenCalledTimes(MAX_INTENTOS);
    expect(filas[0]).toMatchObject({ enviado: false, intentos: MAX_INTENTOS, error: "SMTP caído" });
    expect(esperas).toEqual([1, 2, 4, 8].map((m) => m * 60_000));
    expect(esperaReintento(5)).toBe(16 * 60_000);
  });

  it("un evento esperando reintento no se envía antes de tiempo", () => {
    expect(gruposListos([evento({ id: "a", tipo: "creado", intentos: 1, proximoIntento: min(3) })], min(1), VENTANA)).toHaveLength(0);
  });
});

describe("el aviso nunca rompe el registro", () => {
  it("registrarEvento no lanza aunque la base de datos falle", async () => {
    vi.resetModules();
    vi.doMock("@las3b/db", () => ({
      db: { insert: () => { throw new Error("base caída"); } },
      schema: new Proxy({}, { get: () => ({}) }),
    }));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { registrarEvento } = await import("./actividad");
    await expect(registrarEvento("p1", "creado")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
    vi.doUnmock("@las3b/db");
  });
});

describe("contenido del correo", () => {
  const datos: DatosAviso = {
    proveedorId: "8f3c1d2e-aaaa-bbbb-cccc-111122223333", nombre: "Don Jorge <b>", whatsapp: "573001234567", oficios: ["Plomería"], zonas: ["Suba"],
    porcentaje: 44, faltan: ["Tu documento"], origen: { source: "whatsapp", medium: "grupo", campaign: "ingreso_proveedores", content: "mediterraneo", term: "P-017" }, urlAdmin: "https://lastresb.com.co/admin/proveedores/x",
  };

  it("asunto de proveedor nuevo con el ID de seguimiento (utm_term)", () => {
    const c = armarCorreo(datos, [evento({ id: "a", tipo: "creado" })], T0);
    expect(c.asunto).toBe("LasTresB · Proveedor nuevo: Plomería (P-017)");
  });

  it("asunto de cambios; sin utm_term usa el ID interno corto", () => {
    const sin = { ...datos, origen: {} };
    expect(idDeSeguimiento(sin)).toBe("8f3c1d2e");
    expect(armarCorreo(sin, [evento({ id: "a" })], T0).asunto).toBe("LasTresB · Cambios en Don Jorge <b> (8f3c1d2e)");
  });

  it("lleva texto plano y HTML, los dos botones, la hora de Bogotá, y escapa el HTML", () => {
    const c = armarCorreo(datos, [evento({ id: "a", campos: ["nombre", "zonas"] })], T0);
    expect(c.texto).toContain("Campos que cambiaron: nombre, zonas");
    expect(c.texto).toContain("Campos que faltan: Tu documento");
    expect(c.texto).toContain("https://wa.me/573001234567");
    expect(c.html).toContain("Abrir en el backoffice");
    expect(c.html).toContain("Escribirle por WhatsApp");
    expect(c.html).not.toContain("<b>");
    expect(c.texto).toMatch(/10:00|10:00\s?a\./);
  });

  it("no incluye documentos, RUT ni números de identificación", () => {
    const c = armarCorreo(datos, [evento({ id: "a", tipo: "archivo", campos: ["documento: RUT"] })], T0);
    expect(c.texto.toLowerCase()).not.toMatch(/c[eé]dula|nit:|documento de identidad:/);
  });
});
