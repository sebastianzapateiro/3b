import type { TextoLegal as Texto } from "@las3b/shared";

/** Muestra un texto legal versionado (packages/shared/src/politicas.ts). Avisa si aún es un borrador por completar. */
export function TextoLegal({ texto, children }: { texto: Texto; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl font-extrabold">{texto.titulo}</h1>
      <p className="mt-4 text-sm text-gris">Versión {texto.version} — Vigencia: {new Date(`${texto.vigenteDesde}T00:00:00Z`).toLocaleDateString("es-CO", { dateStyle: "long", timeZone: "UTC" })}.</p>

      {texto.pendientes.length > 0 && (
        <aside role="note" className="mt-5 rounded-[18px] bg-amarillo-suave p-4 text-sm leading-normal text-amarillo-oscuro">
          <b>Documento en revisión.</b> Este texto está pendiente de revisión legal y de completar algunos datos del titular del portal. Si tienes dudas sobre tus derechos, escríbenos desde la página de reclamos.
        </aside>
      )}

      {texto.introduccion && <p className="mt-6 text-lg leading-relaxed text-tinta-2">{texto.introduccion}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {texto.secciones.map((s) => (
          <section key={s.titulo} className="flex flex-col gap-3">
            <h2 className="mt-3 font-display text-2xl font-bold">{s.titulo}</h2>
            {s.parrafos?.map((p) => <p key={p} className="leading-relaxed text-tinta-2">{p}</p>)}
            {s.lista && <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-tinta-2">{s.lista.map((i) => <li key={i}>{i}</li>)}</ul>}
          </section>
        ))}
      </div>
      {children}
    </main>
  );
}
