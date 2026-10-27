import type { MetadataRoute } from "next";
import { COLORES, MARCA } from "@las3b/shared";

/** PWA (RNF-01): instalable desde el navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MARCA.nombre,
    short_name: "Las 3B",
    description: MARCA.lema,
    start_url: "/",
    display: "standalone",
    background_color: COLORES.crema,
    theme_color: COLORES.crema,
    lang: "es-CO",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
