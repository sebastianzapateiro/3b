/**
 * P3 · Cifra los documentos de proveedores que quedaron en texto plano antes de AES-256-GCM (regla 1).
 * Uso: pnpm db:cifrar-documentos            (muestra cuántos hay, no cambia nada)
 *      pnpm db:cifrar-documentos --aplicar  (cifra y calcula la huella)
 * Idempotente: los valores que ya empiezan por `v1:` no se tocan.
 */
import { config } from "dotenv";
config({ path: "../../.env" });

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const { db } = await import("./index");
  const { proveedores } = await import("./schema/index");
  const { cifrar, descifrar, estaCifrado, huella } = await import("./cifrado");
  const { eq, isNotNull } = await import("drizzle-orm");

  const filas = await db.select({ id: proveedores.id, documento: proveedores.documentoCifrado }).from(proveedores).where(isNotNull(proveedores.documentoCifrado));
  const pendientes = filas.filter((f) => f.documento && !estaCifrado(f.documento));
  console.log(`Documentos: ${filas.length} · en texto plano: ${pendientes.length}`);
  if (!aplicar || pendientes.length === 0) {
    if (pendientes.length) console.log("Para cifrarlos: pnpm db:cifrar-documentos --aplicar");
    process.exit(0);
  }

  for (const f of pendientes) {
    const cifrado = cifrar(f.documento!);
    // Comprobación antes de reemplazar: si no descifra igual, no se toca la fila.
    if (descifrar(cifrado) !== f.documento) throw new Error(`La verificación falló para ${f.id}; no se modificó.`);
    await db.update(proveedores).set({ documentoCifrado: cifrado, documentoHuella: huella(f.documento!) }).where(eq(proveedores.id, f.id));
  }
  console.log(`Listo: ${pendientes.length} documentos cifrados.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
