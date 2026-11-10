import Image from "next/image";
import Link from "next/link";
import { IconoCategoria } from "@/components/CategoriaVisual";
import { etiquetaAccesible, VELO, type TileMosaico } from "@/lib/mosaico";

/** Columnas por tamaño (clases estáticas para que Tailwind las genere): tablet usa un grid de 6, escritorio uno de 12. */
const COLUMNAS: Record<number, string> = {
  6: "min-[600px]:col-span-6",
  3: "min-[600px]:col-span-3",
};
const COLUMNAS_FILA3 = "min-[600px]:col-span-3 min-[900px]:col-span-6";

const velo = `linear-gradient(to top, rgba(${VELO.rgb}, ${VELO.opacidadBase}) 0, rgba(${VELO.rgb}, ${VELO.opacidadTexto}) ${VELO.altoTexto}px, rgba(${VELO.rgb}, 0) ${VELO.altoTotal}px)`;

/** Tile del mosaico: foto (o degradado con ícono gigante) de fondo, nombre, 3 oficios y «Ver todo». Todo el tile es el enlace. */
export function CategoryTile({ tile, prioridad = false, carrusel = false }: { tile: TileMosaico; prioridad?: boolean; carrusel?: boolean }) {
  const { tema, disposicion } = tile;
  const foto = tema.foto;
  const grande = !carrusel && disposicion.columnas === 6 && disposicion.fila === 1;
  // Con foto el texto es blanco sobre el velo; sin foto depende del tema (Clases usa tinta y no lleva velo).
  const oscuro = !foto && tema.textoSinFoto === "tinta";
  // En el carrusel del Home todos miden lo mismo y el contenedor da el ancho; en /categorias/… usan el grid de 12 columnas.
  const columnas = carrusel ? "snap-start" : disposicion.fila === 3 ? COLUMNAS_FILA3 : (COLUMNAS[disposicion.columnas] ?? COLUMNAS[3]);
  const alto = carrusel ? "h-[210px] sm:h-[230px]" : disposicion.fila === 1 ? "h-[200px] min-[600px]:h-[300px] min-[900px]:h-[330px]" : "h-[200px] min-[600px]:h-[300px]";

  return (
    <Link
      href={tile.href}
      aria-label={etiquetaAccesible(tile)}
      className={`group relative isolate flex ${alto} ${columnas} flex-col justify-end overflow-hidden rounded-[26px] p-[22px] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-tinta motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${oscuro ? "text-tinta" : "text-white"}`}
      style={foto ? undefined : { backgroundImage: `linear-gradient(135deg, ${tema.desde}, ${tema.hasta})` }}
    >
      {foto ? (
        <Image src={foto.src} alt={foto.alt} fill priority={prioridad} sizes={carrusel ? "300px" : grande ? "(min-width: 900px) 510px, 100vw" : "(min-width: 900px) 250px, (min-width: 600px) 50vw, 100vw"} className="-z-20 object-cover" />
      ) : (
        <IconoCategoria icono={tile.icono} grosor={0.7} className="absolute -right-5 -top-5 -z-10 size-[170px] opacity-[.22]" />
      )}
      {!oscuro && <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: velo }} />}

      <span className="flex flex-col gap-1.5">
        {tile.etiqueta && <span className="text-xs font-bold uppercase tracking-[.14em] opacity-90">{tile.etiqueta}</span>}
        <b className={`font-display font-extrabold leading-[1.05] ${grande ? "text-[28px]" : "text-[23px]"}`}>{tile.nombre}</b>
        <span className="line-clamp-1 text-[13px] opacity-90 min-[600px]:line-clamp-2">{tile.oficios.join(" · ")}</span>
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold">{tile.total} oficios</span>
          <span className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold" style={{ color: tema.pildora }}>Ver todo</span>
        </span>
      </span>
    </Link>
  );
}
