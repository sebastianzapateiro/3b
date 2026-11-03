/**
 * Módulo P2/P3 — nivel público del perfil (verificado, completo, destacado); para listados y tarjetas.
 * PROVISIONAL: se deriva de la completitud (0–100, lib/completitud.ts) con cortes fijos hasta que el
 * ingeniero defina el puntaje real (docs/08-dudas-ingeniero.md, punto 1).
 */
import type { NivelPerfil } from "@/lib/demo";

export const CORTE_COMPLETO = 50;
export const CORTE_DESTACADO = 100;

export function nivelDePerfil(completitud: number): NivelPerfil {
  if (completitud >= CORTE_DESTACADO) return "destacado";
  if (completitud >= CORTE_COMPLETO) return "completo";
  return "verificado";
}
