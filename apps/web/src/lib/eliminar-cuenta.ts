/**
 * B4 · Eliminar una cuenta (CU-27). Solo administradores, desde /admin/usuarios.
 * - Sin historial (pruebas, registros abandonados, borradores de proveedor sin publicar): se borra del todo,
 *   con sus consentimientos, el borrador y sus archivos en Storage.
 * - Con historial (contactos, reseñas, reportes, reclamos, auditoría, perfil ya enviado a revisión…): no se borra
 *   la fila. Se bloquea: `eliminado_en`, `conservar_hasta` (+N años, parámetro), sin sesiones, accesos ni roles,
 *   perfil de proveedor oculto (suspendido → 404) y reseñas anónimas. Los datos se conservan bloqueados (CU-27).
 * Quién tiene historial lo decide la base: si al borrar alguna llave foránea lo impide, se bloquea.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@las3b/db";
import { borrarObjetos } from "@/lib/almacenamiento";
import { parametro } from "@/lib/parametros";

const { user, session, account, twoFactor, usuarioRoles, verification, proveedores, documentos, portafolioFotos, consentimientos } = schema;

export type ResultadoEliminacion = { modo: "borrada" | "bloqueada"; correo: string; conservarHasta?: Date };

class ConHistorial extends Error {}

/** Código de Postgres de la excepción (drizzle la envuelve en `cause`). */
function codigoPg(e: unknown): string | undefined {
  const x = e as { code?: string; cause?: { code?: string } };
  return x?.code ?? x?.cause?.code;
}

export async function eliminarCuenta(usuarioId: string): Promise<ResultadoEliminacion | null> {
  const [persona] = await db.select({ correo: user.email, eliminadoEn: user.eliminadoEn }).from(user).where(eq(user.id, usuarioId)).limit(1);
  if (!persona) return null;
  if (persona.eliminadoEn) return { modo: "bloqueada", correo: persona.correo };

  // 1. Intento de borrado total, en una transacción: si algo lo referencia, Postgres aborta y no queda nada a medias.
  try {
    const archivos = await db.transaction(async (tx) => {
      const [prov] = await tx.select({ id: proveedores.id, estado: proveedores.estado }).from(proveedores).where(eq(proveedores.usuarioId, usuarioId)).limit(1);
      if (prov && prov.estado !== "borrador") throw new ConHistorial();
      let privados: string[] = [];
      let publicos: string[] = [];
      if (prov) {
        privados = (await tx.select({ r: documentos.rutaPrivada }).from(documentos).where(eq(documentos.proveedorId, prov.id))).map((d) => d.r);
        publicos = (await tx.select({ r: portafolioFotos.ruta, m: portafolioFotos.rutaMiniatura }).from(portafolioFotos).where(eq(portafolioFotos.proveedorId, prov.id)))
          .flatMap((f) => (f.m ? [f.r, f.m] : [f.r]));
        await tx.delete(proveedores).where(eq(proveedores.id, prov.id)); // documentos, fotos, servicios… en cascada
      }
      await tx.delete(consentimientos).where(eq(consentimientos.usuarioId, usuarioId));
      await tx.delete(verification).where(eq(verification.value, usuarioId)); // invitaciones y recuperaciones
      await tx.delete(user).where(eq(user.id, usuarioId)); // sesiones, accesos, 2FA y roles en cascada
      return { privados, publicos };
    });
    // Los archivos se borran después de confirmar: si Storage falla, solo quedan objetos huérfanos.
    await Promise.all([borrarObjetos("privado", archivos.privados), borrarObjetos("publico", archivos.publicos)]).catch(() => {});
    return { modo: "borrada", correo: persona.correo };
  } catch (e) {
    if (!(e instanceof ConHistorial) && codigoPg(e) !== "23503") throw e; // 23503: violación de llave foránea
  }

  // 2. Con historial: datos bloqueados N años, sin forma de ingresar (además lo impide el hook de sesión de auth.ts).
  const ahora = new Date();
  const conservarHasta = new Date(ahora);
  conservarHasta.setFullYear(conservarHasta.getFullYear() + (await parametro("conservacion_eliminados_anios")));
  await db.transaction(async (tx) => {
    await tx.update(user).set({ eliminadoEn: ahora, conservarHasta, suspendidoHasta: new Date("9999-12-31"), updatedAt: ahora }).where(eq(user.id, usuarioId));
    await tx.delete(session).where(eq(session.userId, usuarioId));
    await tx.delete(account).where(eq(account.userId, usuarioId));
    await tx.delete(twoFactor).where(eq(twoFactor.userId, usuarioId));
    await tx.delete(usuarioRoles).where(eq(usuarioRoles.usuarioId, usuarioId));
    await tx.delete(verification).where(eq(verification.value, usuarioId));
    await tx.update(proveedores).set({ estado: "suspendido", updatedAt: ahora }).where(eq(proveedores.usuarioId, usuarioId));
  });
  return { modo: "bloqueada", correo: persona.correo, conservarHasta };
}
