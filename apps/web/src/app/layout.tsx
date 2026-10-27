import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { MARCA } from "@las3b/shared";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? `https://${MARCA.dominio}`),
  title: { default: `${MARCA.nombre} · ${MARCA.lema}`, template: `%s · ${MARCA.nombre}` },
  description:
    "Encuentra plomeros, profesores, acarreos y oficios de confianza en tu localidad de Bogotá. Escríbeles directo por WhatsApp, sin comisiones.",
  applicationName: MARCA.nombre,
};

export const viewport: Viewport = {
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-crema font-sans text-tinta antialiased">{children}</body>
    </html>
  );
}
