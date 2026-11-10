/**
 * P7 / SEO · Metadatos de la ficha pública de un proveedor (RNF-03).
 * Una ficha, una URL principal: todas las URLs /nombre/oficio de un proveedor muestran el mismo contenido, así que TODAS declaran
 * como canonical la URL principal (la del oficio principal). Solo esa va en el sitemap. Las secundarias siguen funcionando,
 * sin redirección. Si la ficha no es indexable (lib/indexacion.ts), lleva noindex.
 */
import type { Metadata } from "next";
import { rutaPrincipalProveedor } from "@las3b/shared";
import { esFichaIndexable } from "@/lib/indexacion";
import type { PortafolioCompleto } from "@/lib/portafolio-completo";
import { meta } from "@/lib/seo";

export const rutaPrincipalDe = (p: Pick<PortafolioCompleto, "slug" | "categorias">) => rutaPrincipalProveedor(p.slug, p.categorias);

export function metadatosFicha(p: PortafolioCompleto): Metadata {
  const oficios = p.categorias.slice(0, 2).join(" y ") || "servicios";
  const zona = p.localidades.slice(0, 2).join(" y ") || "Bogotá";
  const titulo = `${p.nombre}: ${oficios} en ${zona}, Bogotá`;
  // `||` y no `??`: una presentación vacía no debe dejar la meta descripción en blanco.
  const descripcion = (p.presentacion?.trim() || `${p.nombre} ofrece ${oficios.toLowerCase()} en ${zona}, Bogotá. Mira sus reseñas y escríbele por WhatsApp.`).slice(0, 155);
  return meta({ titulo, descripcion, ruta: rutaPrincipalDe(p), tipo: "profile", noindex: !esFichaIndexable(p) });
}
