/**
 * GET/POST /api/cron/avisos — lo llama un proceso programado cada minuto (Vercel Cron, n8n o cron del servidor).
 * Envía los avisos de actividad de proveedores que ya cumplieron su ventana. Protegido con CRON_SECRET (Bearer).
 */
import { NextResponse } from "next/server";
import { enviarAvisosPendientes } from "@/lib/actividad";

export const dynamic = "force-dynamic";

async function ejecutar(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await enviarAvisosPendientes()) });
  } catch (e) {
    console.error("[cron/avisos]", e);
    return NextResponse.json({ error: "Error procesando la cola" }, { status: 500 });
  }
}

export const GET = ejecutar;
export const POST = ejecutar;
