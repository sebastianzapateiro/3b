import type { MetadataRoute } from "next";
import { absoluta, INDEXABLE } from "@/lib/seo";

/** robots.txt: abierto solo en producción; nunca rastrear backoffice, API ni pantallas de cuenta. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/ingresar", "/registro", "/recuperar", "/nueva-clave", "/cuenta", "/panel", "/proveedores/registro", "/buscar?"],
    },
    sitemap: absoluta("/sitemap.xml"),
    host: absoluta("/"),
  };
}
