import type { Metadata } from "next";
import { RegistroProveedorClient } from "./RegistroProveedorClient";

export const metadata: Metadata = { title: "Registrarme como proveedor · LasTresB" };

/** P3 · Alta de proveedor en 3 pasos. Wizard con estado local; guarda vía Server Actions. */
export default function RegistroProveedor() {
  return <RegistroProveedorClient />;
}
