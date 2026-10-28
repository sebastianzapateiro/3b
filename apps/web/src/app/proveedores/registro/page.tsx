import type { Metadata } from "next";
import { RegistroProveedorClient } from "./RegistroProveedorClient";

export const metadata: Metadata = { title: "Registrarme como proveedor · Las 3B" };

/** P3 · Alta de proveedor en 3 pasos. Wizard con estado local; guarda vía Server Actions. */
export default function RegistroProveedor() {
  return <RegistroProveedorClient />;
}
