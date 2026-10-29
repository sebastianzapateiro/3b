/** Piezas para imágenes generadas con next/og (Open Graph, íconos PNG). */
import { COLORES } from "@las3b/shared";

const TRES =
  "M646 -24C994 -24 1235 164 1235 420C1235 598 1114 751 898 776V779C1066 807 1189 924 1189 1099C1189 1342 963 1514 646 1514C302 1514 90 1310 90 1038H427C427 1164 517 1248 646 1248C770 1248 857 1171 857 1059C857 950 766 884 618 884H480V632H618C776 632 879 558 879 444C879 328 783 250 643 250C492 250 401 344 401 501H61C61 220 248 -24 646 -24Z";
const B =
  "M96 0H761C1092 0 1279 174 1279 421C1279 632 1136 768 950 780V782C1118 819 1227 940 1227 1112C1227 1335 1047 1490 716 1490H96ZM447 276V623H704C833 623 912 555 912 447C912 340 832 276 702 276ZM447 885V1214H682C797 1214 868 1150 868 1050C868 949 797 885 682 885Z";

export function MonogramaOg({ ancho, oscuro = false }: { ancho: number; oscuro?: boolean }) {
  return (
    <svg width={ancho} height={(ancho * 188) / 382} viewBox="4 -182 382 188">
      <path transform="translate(1.92 0) scale(0.11719 -0.11719)" d={TRES} fill={oscuro ? COLORES.crema : COLORES.tinta} />
      <path transform="translate(145.54 0) scale(0.11719 -0.11719)" d={B} fill={oscuro ? COLORES.ladrilloClaro : COLORES.ladrillo} />
      <circle cx="363.69" cy="-148.8" r="18" fill={oscuro ? "#3FB394" : COLORES.verde} />
      <circle cx="363.69" cy="-88.8" r="18" fill={oscuro ? COLORES.ladrilloClaro : COLORES.ladrillo} />
      <circle cx="363.69" cy="-28.8" r="18" fill={COLORES.amarillo} />
    </svg>
  );
}

/** Ícono cuadrado (fondo tinta) para PWA y Apple. */
export function IconoCuadrado({ tam, redondeado = true }: { tam: number; redondeado?: boolean }) {
  return (
    <div
      style={{
        width: tam,
        height: tam,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORES.tinta,
        borderRadius: redondeado ? tam * 0.22 : 0,
      }}
    >
      <MonogramaOg ancho={tam * 0.74} oscuro />
    </div>
  );
}

/**
 * Descarga Bricolage Grotesque / Inter de Google Fonts solo con los caracteres usados.
 * Si no hay red (build sin internet) devuelve undefined y next/og usa su fuente por defecto.
 */
export async function fuente(familia: "Bricolage Grotesque" | "Inter", peso: number, texto: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${familia.replace(/ /g, "+")}:wght@${peso}&text=${encodeURIComponent(texto)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return undefined;
    return { name: familia, data: await (await fetch(url)).arrayBuffer(), weight: peso as 400 | 600 | 800, style: "normal" as const };
  } catch {
    return undefined;
  }
}

export const definidas = <T,>(xs: (T | undefined)[]) => xs.filter((x): x is T => x !== undefined);

export const TAM_OG = { width: 1200, height: 630 };

/** Imagen social (1200×630) para páginas internas: etiqueta superior, título grande y línea de apoyo. */
export async function imagenOg(o: { etiqueta: string; titulo: string; detalle?: string }) {
  const { ImageResponse } = await import("next/og");
  const { MARCA } = await import("@las3b/shared");
  const fonts = definidas([
    await fuente("Bricolage Grotesque", 800, o.titulo + o.etiqueta + MARCA.wordmark),
    await fuente("Inter", 600, (o.detalle ?? "") + MARCA.dominio + MARCA.lema),
  ]);
  const largo = o.titulo.length > 46;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: COLORES.crema, padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <MonogramaOg ancho={84} />
            <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: 36, color: COLORES.tinta }}>
              LasTres<span style={{ color: COLORES.ladrillo }}>B</span>
            </div>
          </div>
          <div style={{ display: "flex", background: COLORES.verde, color: "#FFFFFF", fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: 26, padding: "10px 22px", borderRadius: 999 }}>{o.etiqueta}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: largo ? 62 : 78, lineHeight: 1.05, letterSpacing: -2, color: COLORES.tinta }}>{o.titulo}</div>
          {o.detalle && <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 30, lineHeight: 1.35, color: "#3E4A47", maxWidth: 940 }}>{o.detalle}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 26, color: COLORES.verde }}>{MARCA.dominio}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: COLORES.verde }} />
            <div style={{ width: 22, height: 22, borderRadius: 11, background: COLORES.ladrillo }} />
            <div style={{ width: 22, height: 22, borderRadius: 11, background: COLORES.amarillo }} />
          </div>
        </div>
      </div>
    ),
    { ...TAM_OG, fonts },
  );
}
