import { describe, expect, it } from "vitest";
import { normalizarRed, redesDesdeBase, redesDesdeFormulario } from "@las3b/shared";

describe("redes sociales del proveedor", () => {
  it("un usuario suelto arma el enlace de la red", () => {
    expect(normalizarRed("instagram", "@lastresb.bogota3")).toBe("https://www.instagram.com/lastresb.bogota3");
    expect(normalizarRed("instagram", "lastresb.bogota3")).toBe("https://www.instagram.com/lastresb.bogota3");
    expect(normalizarRed("tiktok", "@mi_negocio")).toBe("https://www.tiktok.com/@mi_negocio");
  });

  it("un enlace se limpia: https, sin parámetros de seguimiento ni barra final", () => {
    expect(normalizarRed("instagram", "http://www.instagram.com/mi.negocio/?igsh=abc123")).toBe("https://www.instagram.com/mi.negocio");
    expect(normalizarRed("facebook", "facebook.com/mipagina/")).toBe("https://www.facebook.com/mipagina".replace("www.", ""));
    expect(normalizarRed("youtube", "https://youtu.be/xyz?si=1")).toBe("https://youtu.be/xyz");
  });

  it("rechaza enlaces de otra red, esquemas raros, datos en la URL y direcciones internas", () => {
    expect(normalizarRed("instagram", "https://facebook.com/algo")).toBeNull();
    expect(normalizarRed("instagram", "https://instagram.com.malo.co/x")).toBeNull();
    expect(normalizarRed("web", "javascript:alert(1)")).toBeNull();
    expect(normalizarRed("web", "https://usuario:clave@sitio.com")).toBeNull();
    expect(normalizarRed("web", "http://localhost:3000")).toBeNull();
    expect(normalizarRed("web", "192.168.0.1")).toBeNull();
    expect(normalizarRed("instagram", "@")).toBeNull();
  });

  it("el sitio web acepta cualquier dominio y se guarda con https", () => {
    expect(normalizarRed("web", "www.tusitio.com.co")).toBe("https://www.tusitio.com.co");
    expect(normalizarRed("web", "http://tusitio.com/contacto?x=1")).toBe("https://tusitio.com/contacto");
  });

  it("vacío es válido (sin red) y se omite", () => {
    expect(normalizarRed("instagram", "   ")).toBe("");
    const { redes, error } = redesDesdeFormulario((n) => ({ red_instagram: "@yo", red_facebook: "", red_tiktok: "", red_youtube: "", red_web: "tusitio.com" })[n] ?? "");
    expect(error).toBeUndefined();
    expect(redes).toEqual({ instagram: "https://www.instagram.com/yo", web: "https://tusitio.com" });
  });

  it("un error nombra la red para que la persona sepa cuál corregir", () => {
    const { error } = redesDesdeFormulario((n) => (n === "red_tiktok" ? "https://instagram.com/x" : ""));
    expect(error).toContain("TikTok");
  });

  it("lo guardado en la base se lee a salvo: ignora claves raras y enlaces inválidos", () => {
    expect(redesDesdeBase({ instagram: "https://www.instagram.com/yo", otra: "https://x.com", web: "javascript:alert(1)" })).toEqual({ instagram: "https://www.instagram.com/yo" });
    expect(redesDesdeBase(null)).toEqual({});
  });
});
