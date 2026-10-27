import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { IconoCuadrado } from "@/lib/og";

/** Íconos PNG de la PWA (manifest) y logo de la organización en schema.org: /iconos/192, /iconos/512. */
const TAMANOS = ["192", "512"] as const;

export const dynamicParams = false;
export function generateStaticParams() {
  return TAMANOS.map((tam) => ({ tam }));
}

export async function GET(_: Request, { params }: { params: Promise<{ tam: string }> }) {
  const { tam } = await params;
  if (!TAMANOS.includes(tam as (typeof TAMANOS)[number])) notFound();
  const n = Number(tam);
  return new ImageResponse(<IconoCuadrado tam={n} redondeado={false} />, { width: n, height: n });
}
