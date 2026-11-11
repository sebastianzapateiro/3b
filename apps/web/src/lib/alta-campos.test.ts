import { describe, expect, it } from "vitest";
import { combinarAvisos, datosAEnviar, grupoDeCampo } from "@/lib/alta-campos";

/** La pantalla tal como queda al recargar: identidad vacía (no se vuelve a mostrar) y el tipo de documento en «cc». */
const pantalla = [
  { nombre: "nombrePublico", valor: "Plomería Jairo" },
  { nombre: "presentacion", valor: "Hola" },
  { nombre: "categoria", valor: "12" },
  { nombre: "categoria", valor: "15" },
  { nombre: "localidad", valor: "3" },
  { nombre: "_como", valor: "1" },
  { nombre: "ofreceGarantia", valor: "on" },
  { nombre: "red_instagram", valor: "@jairo" },
  { nombre: "red_facebook", valor: "" },
  { nombre: "tipoDocumento", valor: "cc" },
  { nombre: "documento", valor: "" },
  { nombre: "direccionNotificaciones", valor: "" },
  { nombre: "numeroMatricula", valor: "" },
];

describe("autoguardado del alta: qué campos viajan", () => {
  it("sin tocar nada no envía nada", () => {
    expect(datosAEnviar(pantalla, new Set())).toEqual({});
  });

  it("al editar otro campo no viajan la dirección, la matrícula ni el tipo de documento (no se borran)", () => {
    const d = datosAEnviar(pantalla, new Set([grupoDeCampo("presentacion")]));
    expect(d).toEqual({ presentacion: "Hola" });
  });

  it("la dirección vacía solo viaja si la persona la tocó (así sí puede borrarla)", () => {
    expect(datosAEnviar(pantalla, new Set(["direccionNotificaciones"]))).toEqual({ direccionNotificaciones: "" });
  });

  it("el tipo y el número de documento viajan juntos", () => {
    expect(grupoDeCampo("tipoDocumento")).toBe(grupoDeCampo("documento"));
    expect(datosAEnviar(pantalla, new Set([grupoDeCampo("documento")]))).toEqual({ tipoDocumento: "cc", documento: "" });
  });

  it("los grupos viajan completos: oficios como lista, redes y «cómo trabajas» enteros", () => {
    expect(datosAEnviar(pantalla, new Set(["categoria"]))).toEqual({ categoria: ["12", "15"] });
    expect(datosAEnviar(pantalla, new Set(["localidad"]))).toEqual({ localidad: ["3"] });
    expect(datosAEnviar(pantalla, new Set([grupoDeCampo("red_facebook")]))).toEqual({ red_instagram: "@jairo", red_facebook: "" });
    expect(datosAEnviar(pantalla, new Set([grupoDeCampo("visitaAConvenir")]))).toEqual({ _como: "1", ofreceGarantia: "on" });
  });
});

describe("autoguardado del alta: avisos", () => {
  it("conserva el aviso de un campo que no viajó y quita el del que ya se corrigió", () => {
    const previos = { whatsapp: "Falta completar el WhatsApp", slug: "Esa dirección ya está en uso" };
    expect(combinarAvisos(previos, new Set(["slug"]), {})).toEqual({ whatsapp: "Falta completar el WhatsApp" });
  });
  it("agrega los avisos nuevos", () => {
    expect(combinarAvisos({}, new Set(["redes"]), { redes: "Enlace no válido" })).toEqual({ redes: "Enlace no válido" });
  });
});
