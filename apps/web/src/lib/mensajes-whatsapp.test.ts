import { describe, expect, it } from "vitest";
import { enlaceWhatsApp, mensajeSolicitud, normalizarWhatsapp } from "@las3b/shared";

describe("mensaje del cliente al proveedor", () => {
  const base = { proveedor: "Don Jorge", cliente: "Marcela", categoria: "Plomería", solicitud: "Se me dañó la llave del lavaplatos. ¿Cuánto cobra la visita?" };

  it("incluye la localidad y deja la solicitud del cliente tal cual, entre comillas", () => {
    const m = mensajeSolicitud({ ...base, lugar: "la localidad Suba" });
    expect(m).toBe(`Hola Don Jorge, soy Marcela. Te escribo para cotizar un servicio de plomería para la localidad Suba. Te encontré en la página lastresb.com.co y pude ver tu perfil. Solicitud: "${base.solicitud}"`);
  });

  it("incluye la ubicación exacta cuando el cliente la escribió", () => {
    expect(mensajeSolicitud({ ...base, lugar: "la ubicación Calle 80 # 20-30" })).toContain("para la ubicación Calle 80 # 20-30.");
  });

  it("omite el lugar y la categoría si no se conocen", () => {
    expect(mensajeSolicitud({ ...base, categoria: null, lugar: null })).toContain("cotizar un servicio. Te encontré");
  });
});

describe("WhatsApp", () => {
  it("normaliza celulares colombianos y descarta lo que no parece un número", () => {
    expect(normalizarWhatsapp("300 123 4567")).toBe("573001234567");
    expect(normalizarWhatsapp("+57 300 123 4567")).toBe("573001234567");
    expect(normalizarWhatsapp("123")).toBeNull();
  });

  it("el enlace genérico lleva categoría y localidad", () => {
    const url = enlaceWhatsApp("+57 300 123 4567", "Plomería", "Suba");
    expect(url.startsWith("https://wa.me/573001234567?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("plomería en Suba");
  });
});
