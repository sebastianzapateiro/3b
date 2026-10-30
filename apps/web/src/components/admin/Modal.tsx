"use client";

/**
 * Ventana emergente del backoffice sobre <dialog> nativo: atrapa el foco, se cierra con Esc,
 * con la X o con un clic fuera. Se abre por URL (p. ej. ?c=nueva) y al cerrar vuelve a `cerrarHref`.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function Modal({ titulo, cerrarHref, children }: { titulo: string; cerrarHref: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-titulo"
      onClose={() => router.replace(cerrarHref, { scroll: false })}
      // Clic en el fondo: el evento llega al propio <dialog>, no a su contenido.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto w-[min(560px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-[20px] bg-white p-0 text-tinta shadow-[0_24px_60px_rgba(27,38,35,0.25)] backdrop:bg-tinta/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex flex-col gap-3 p-[22px]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="modal-titulo" className="font-display text-xl font-bold">{titulo}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full text-tinta-2 hover:bg-arena">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
