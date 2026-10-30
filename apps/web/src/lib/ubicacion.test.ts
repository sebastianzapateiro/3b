import { describe, expect, it } from "vitest";
import { distanciaALocalidades, distanciaKm, enBogota } from "@/lib/ubicacion";

describe("ubicación", () => {
  it("la distancia a uno mismo es cero y es simétrica", () => {
    const a = { lat: 4.7, lng: -74.03 };
    const b = { lat: 4.6, lng: -74.07 };
    expect(distanciaKm(a, a)).toBe(0);
    expect(distanciaKm(a, b)).toBeCloseTo(distanciaKm(b, a), 6);
  });

  it("Usaquén queda a unos 20 km de La Candelaria", () => {
    const km = distanciaKm({ lat: 4.7, lng: -74.03 }, { lat: 4.597, lng: -74.073 });
    expect(km).toBeGreaterThan(10);
    expect(km).toBeLessThan(15);
  });

  it("reconoce puntos dentro y fuera de Bogotá", () => {
    expect(enBogota({ lat: 4.65, lng: -74.08 })).toBe(true);
    expect(enBogota({ lat: 6.24, lng: -75.58 })).toBe(false);
  });

  it("un proveedor en la misma localidad queda más cerca que uno lejano", () => {
    const enSuba = { lat: 4.74, lng: -74.09 };
    expect(distanciaALocalidades(enSuba, ["suba"])!).toBeLessThan(distanciaALocalidades(enSuba, ["usme"])!);
    expect(distanciaALocalidades(enSuba, ["suba", "usme"])).toBe(distanciaALocalidades(enSuba, ["suba"]));
  });

  it("devuelve null si no conoce ninguna localidad", () => {
    expect(distanciaALocalidades({ lat: 4.7, lng: -74 }, ["no-existe"])).toBeNull();
  });
});
