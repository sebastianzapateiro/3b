import { describe, expect, it } from "vitest";
import * as p from "@/lib/plantillas";

describe("plantillas de registro", () => {
  it("todas las de correo traen asunto y texto, sin variables sin reemplazar", () => {
    const mensajes = [
      p.confirmarCorreo({ nombre: "Marcela", url: "https://x.co/v" }),
      p.recuperarClave({ nombre: "Marcela", url: "https://x.co/r" }),
      p.invitacionCuenta({ nombre: "Jorge", motivo: "Te registramos.", url: "https://x.co/i", horas: 72 }),
      p.claveCambiadaPorEquipo({ nombre: "Jorge" }),
      p.bienvenidaCliente({ nombre: "Marcela" }),
      p.bienvenidaProveedor({ nombre: "Jorge" }),
      p.registroRecibido({ nombre: "Jorge" }),
      p.proveedorAprobado({ nombre: "Jorge", nombrePublico: "Don Jorge", slug: "don-jorge" }),
      p.proveedorRechazado({ nombre: "Jorge", motivo: "Documento ilegible" }),
    ];
    for (const m of mensajes) {
      expect(m.asunto.length).toBeGreaterThan(5);
      expect(m.texto).toContain("LasTresB");
      expect(m.texto).not.toMatch(/undefined|\$\{|null/);
      expect(m.html).toContain("<!doctype html>");
      expect(m.html).not.toMatch(/undefined|\$\{|<img/);
    }
  });

  it("saluda sin nombre cuando no se conoce", () => {
    expect(p.bienvenidaCliente({ nombre: null }).texto).toMatch(/^Hola\.\n/);
  });

  it("el aprobado lleva el enlace de la página y el rechazado, el motivo", () => {
    expect(p.proveedorAprobado({ nombre: "J", nombrePublico: "Don Jorge", slug: "don-jorge" }).texto).toContain("/don-jorge");
    expect(p.proveedorRechazado({ nombre: "J", motivo: "Documento ilegible" }).texto).toContain("Motivo: Documento ilegible");
  });

  it("los de seguimiento de solicitudes llevan quién, qué y dónde", () => {
    const a = p.whatsappPedirAProveedor({ proveedor: "Don Jorge", cliente: "Marcela", servicio: "plomería", lugar: "la localidad Suba", whatsappCliente: "573001234567" });
    expect(a).toContain("Marcela busca plomería para la localidad Suba");
    expect(a).toContain("+573001234567");
    expect(p.whatsappAvisarCliente({ cliente: "Marcela", servicio: "plomería", proveedor: "Don Jorge" })).toContain("Ya le pedimos a Don Jorge");
    expect(p.whatsappSinProveedor({ cliente: "Marcela", servicio: "plomería" })).toContain("Seguimos buscando");
  });

  it("los de WhatsApp son una sola línea con el dato clave", () => {
    expect(p.whatsappInvitacion({ nombre: "Jorge", url: "https://x.co/i", horas: 72 })).toContain("vence en 72 horas");
    expect(p.whatsappProveedorAprobado({ nombre: "Jorge", nombrePublico: "Don Jorge", slug: "dj" })).toContain("/dj");
    expect(p.whatsappProveedorRechazado({ nombre: "Jorge", motivo: "Documento ilegible" })).toContain("Documento ilegible");
  });
});
