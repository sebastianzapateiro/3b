import { ImageResponse } from "next/og";
import { IconoCuadrado } from "@/lib/og";

/** Ícono al agregar a la pantalla de inicio en iPhone (iOS recorta las esquinas). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconoCuadrado tam={180} redondeado={false} />, size);
}
