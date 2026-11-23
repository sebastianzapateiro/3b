/**
 * Beneficios de /proveedores (P2, CU-01): explica en una línea qué es LasTresB a quien llega directo desde Google.
 * Para clientes. Fondo blanco, íconos pequeños y divisores sutiles; la página la oculta cuando hay búsqueda o filtros.
 */
const trazo = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const PUNTOS = [
  { texto: "Escríbeles por WhatsApp", icono: <svg {...trazo}><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" /></svg> },
  { texto: "Gratis, sin comisiones", icono: <svg {...trazo}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg> },
  { texto: "Perfiles revisados por el equipo", icono: <svg {...trazo}><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg> },
];

export function BandaConfianza() {
  return (
    <aside aria-label="Cómo funciona LasTresB" className="bg-white">
      <ul className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-0 gap-y-1 px-4 py-3 text-[13px] font-semibold text-tinta sm:px-6 sm:text-sm">
        {PUNTOS.map((p, i) => (
          <li key={p.texto} className={`flex items-center gap-2 px-4 ${i > 0 ? "sm:border-l sm:border-borde" : ""}`}>
            <span className="text-verde">{p.icono}</span>
            {p.texto}
          </li>
        ))}
      </ul>
    </aside>
  );
}
