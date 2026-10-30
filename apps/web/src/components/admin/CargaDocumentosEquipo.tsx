"use client";

/** B1 · El equipo carga documentos a nombre de un proveedor; al terminar refresca la ficha para poder abrirlos. */
import { useRouter } from "next/navigation";
import { CargaDocumento, type DocumentoRequerido } from "@/components/CargaDocumento";

export function CargaDocumentosEquipo({ proveedorId, documentos }: { proveedorId: string; documentos: DocumentoRequerido[] }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2.5">
      {documentos.map((d) => (
        <CargaDocumento key={d.tipo} doc={d} api={`/api/v1/admin/proveedores/${proveedorId}/documentos`} onCargado={() => router.refresh()} />
      ))}
    </div>
  );
}
