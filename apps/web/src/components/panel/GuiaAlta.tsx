"use client";

/**
 * P8 · Franja que guía el alta dentro del panel (CU-30): dice cuál es el siguiente paso y lleva a él.
 * No sale en el Resumen, que ya tiene su propia tarjeta de pasos.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

type Paso = { titulo: string; texto: string; href: string; numero: number };

export function GuiaAlta({ siguiente, total, listo }: { siguiente: Paso | null; total: number; listo: boolean }) {
  const ruta = usePathname();
  if (ruta === "/panel" || ruta === "/panel/confirmar") return null;

  if (listo) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-verde-claro px-4 py-3 text-[15px] text-verde-oscuro">
        <span><b>Ya tienes todo lo obligatorio.</b> Revisa tus datos y publícalo.</span>
        <Link href="/panel/confirmar" className="inline-flex h-10 items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Revisar y publicar</Link>
      </div>
    );
  }
  if (!siguiente) return null;

  const [destino, ancla] = siguiente.href.split("#");
  const aqui = ruta === destino;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-amarillo-suave px-4 py-3 text-[15px] text-amarillo-oscuro">
      <span className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-[0.8px]">Paso {siguiente.numero} de {total}{aqui ? " · aquí abajo" : ""}</span>
        <span><b>{siguiente.titulo}.</b> {siguiente.texto}</span>
      </span>
      {aqui ? (
        ancla && <a href={`#${ancla}`} className="inline-flex h-10 items-center rounded-xl border-[1.5px] border-amarillo-oscuro/30 px-4 text-sm font-semibold">Ir al formulario</a>
      ) : (
        <Link href={siguiente.href} className="inline-flex h-10 items-center rounded-xl bg-tinta px-4 text-sm font-semibold text-white">Continuar</Link>
      )}
    </div>
  );
}
