import type { MetadataRoute } from "next";
import { COLORES, MARCA } from "@las3b/shared";
import { DESCRIPCION } from "@/lib/seo";

/** PWA (RNF-01): instalable desde el navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MARCA.nombre} · ${MARCA.lema}`,
    short_name: MARCA.nombre,
    description: DESCRIPCION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: COLORES.crema,
    theme_color: COLORES.crema,
    lang: "es-CO",
    dir: "ltr",
    categories: ["business", "lifestyle", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/iconos/192", sizes: "192x192", type: "image/png" },
      { src: "/iconos/512", sizes: "512x512", type: "image/png" },
      { src: "/iconos/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
