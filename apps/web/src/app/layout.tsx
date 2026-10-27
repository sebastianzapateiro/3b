import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { MARCA } from "@las3b/shared";
import { Analitica } from "@/components/Analitica";
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
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
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
        {children}
        <Analitica />
      </body>
    </html>
  );
}
