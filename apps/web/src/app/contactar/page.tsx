import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { FormularioContacto } from "@/components/FormularioContacto";

export const metadata: Metadata = { title: "Contactar al proveedor", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Paso previo a abrir WhatsApp: aquí se piden nombre, WhatsApp y la autorización de datos (antes se pedían al buscar). */
export default async function Contactar({ searchParams }: { searchParams: Promise<{ p?: string; volver?: string }> }) {
  const { p = "", volver = "" } = await searchParams;
  const [prov] = await db.select({ nombre: schema.proveedores.nombrePublico }).from(schema.proveedores).where(eq(schema.proveedores.slug, p)).limit(1);
  // Solo se vuelve al registro del clic de este mismo sitio.
  const destino = volver.startsWith("/api/v1/contactos/ir?") ? volver : `/api/v1/contactos/ir?p=${encodeURIComponent(p)}&origen=perfil`;

  return (
    <main className="mx-auto flex max-w-[520px] flex-col gap-5 px-5 py-10 sm:py-16">
      <h1 className="font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">
        {prov ? `Escríbele a ${prov.nombre}` : "Escríbele al proveedor"}
      </h1>
      <p className="text-base leading-normal text-tinta-2">
        Para abrir el chat de WhatsApp con el proveedor necesitamos tu nombre y tu número. Así el proveedor sabe quién le escribe y puede cotizarte.
      </p>
      <FormularioContacto destino={destino} />
    </main>
  );
}
