import { ImageResponse } from "next/og";
import { COLORES, MARCA } from "@las3b/shared";
import { definidas, fuente, MonogramaOg } from "@/lib/og";

/** Imagen al compartir el sitio en WhatsApp, Facebook, X, LinkedIn (1200×630). */
export const alt = `${MARCA.nombre}: ${MARCA.lema}. Directorio de servicios y oficios por localidad.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITULO = "Encuentra quién te ayude, cerca de ti.";
const TEXTO = "Plomeros, profesores, acarreos y oficios de confianza en tu localidad. Escríbeles directo por WhatsApp, sin comisiones.";

export default async function Imagen() {
  const fonts = definidas([
    await fuente("Bricolage Grotesque", 800, TITULO + MARCA.wordmark),
    await fuente("Inter", 600, TEXTO + MARCA.lema + MARCA.dominio + "BuenoBonitoBarato·"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: COLORES.crema, padding: 64, gap: 48 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <MonogramaOg ancho={96} />
            <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: 40, color: COLORES.tinta, letterSpacing: -1 }}>
              LasTres<span style={{ color: COLORES.ladrillo }}>B</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: 76, lineHeight: 1.02, letterSpacing: -2.5, color: COLORES.tinta }}>
              Encuentra quién te ayude,&nbsp;<span style={{ color: COLORES.verde }}>cerca de ti.</span>
            </div>
            <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 28, lineHeight: 1.4, color: "#3E4A47", maxWidth: 640 }}>{TEXTO}</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 26, color: COLORES.verde }}>{MARCA.dominio}</div>
        </div>
        <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center" }}>
          {[
            { b: "Bueno", t: "Identidad verificada", c: "#3FB394" },
            { b: "Bonito", t: "Fotos de trabajos reales", c: COLORES.ladrilloClaro },
            { b: "Barato", t: "Sin comisiones", c: COLORES.amarillo },
          ].map((x) => (
            <div key={x.b} style={{ display: "flex", flexDirection: "column", gap: 6, background: COLORES.tinta, borderRadius: 28, padding: "26px 28px" }}>
              <div style={{ width: 64, height: 8, borderRadius: 4, background: x.c }} />
              <div style={{ fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: 38, color: x.c }}>{x.b}</div>
              <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 22, color: "#C9D1CF" }}>{x.t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
