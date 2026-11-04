"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marcarVistos } from "@/lib/actividad";
import { exigirBackoffice } from "@/lib/verificacion";

/** Marca como vistos todos los movimientos (solo Admin con 2FA). */
export async function marcarActividadVista() {
  await exigirBackoffice(true);
  await marcarVistos();
  revalidatePath("/admin/actividad");
  redirect("/admin/actividad?ok=Todo%20quedó%20como%20visto.");
}
