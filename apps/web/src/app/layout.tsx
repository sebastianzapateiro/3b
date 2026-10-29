import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { MARCA } from "@las3b/shared";
import { Analitica } from "@/components/Analitica";
import { Cabecera } from "@/components/Cabecera";
import { MarcoSitio } from "@/components/MarcoSitio";
import { Pie } from "@/components/Pie";
import { DESCRIPCION, INDEXABLE, SITIO_URL } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: { default: `${MARCA.nombre} · Servicios y oficios de confianza en Bogotá`, template: `%s · ${MARCA.nombre}` },
  description: DESCRIPCION,
  applicationName: MARCA.nombre,
  keywords: [
    "servicios en Bogotá",
    "plomero Bogotá",
    "electricista Bogotá",
    "profesor particular Bogotá",
    "clases de inglés Bogotá",
    "acarreos Bogotá",
    "mudanzas pequeñas Bogotá",
    "oficios por localidad",
  ],
  category: "Servicios",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: MARCA.nombre,
    title: `${MARCA.nombre} · ${MARCA.lema}`,
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image", title: `${MARCA.nombre} · ${MARCA.lema}`, description: DESCRIPCION },
  robots: INDEXABLE
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "PV2Tc0MI8AE_GoDiaFVqWuM09AtV7Ie2ANLyKtOexRU",
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
  alternates: { types: { "application/rss+xml": [{ url: "/guias/feed.xml", title: "Guías de LasTresB" }] } },
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: MARCA.nombre, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-crema font-sans text-tinta antialiased">
        <MarcoSitio cabecera={<Cabecera />} pie={<Pie />}>{children}</MarcoSitio>
        <Analitica />
        {/* Vercel Web Analytics: sin cookies, solo envía datos en despliegues de Vercel (no en local). */}
        <Analytics />
      </body>
    </html>
  );
}
