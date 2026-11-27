import Link from "next/link";
import { EtiquetaOficio } from "@/components/EtiquetaOficio";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
import type { ResultadoBusqueda } from "@/lib/busqueda";
import { getAvatarInfo } from "@/lib/avatar-helper";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const TONO_INSIGNIA: Record<string, string> = {
  verificado: "bg-verde-claro text-verde-oscuro",
  formalizado: "bg-amarillo-suave text-amarillo-oscuro",
  apto_menores: "bg-ladrillo-suave text-ladrillo-oscuro",
  certificado: "bg-verde-claro text-verde-oscuro",
};

/** Devuelve la información del avatar en cascada:
 *  1) Foto de perfil principal del proveedor
 *  2) Si no tiene foto de perfil, usa automáticamente la primera foto válida de sus fotos de referencia/portafolio de trabajos
 *  3) Si no tiene ninguna foto subida todavía, muestra un avatar circular cálido con las iniciales del proveedor (ej. "RM") sobre fondo suave acorde a la paleta de marca (verde salvia suave o crema cálido con borde sutil), evitando siluetas grises frías.
 */
function avatarInfoFromBusqueda(r: ResultadoBusqueda) {
  // Priority 1: Foto de perfil principal del proveedor
  if (r.fotoPerfil) {
    return {
      type: "perfil" as const,
      url: r.fotoPerfil,
      iniciales: "",
      color: "#0F6B5C",
    };
  }

  // Priority 2: Primera foto válida de sus fotos de referencia/portafolio de trabajos
  // (En el ResultadoBusqueda no viene fotos_trabajos directamente; se poblaría desde el schema del proveedor).
  // Por ahora, caemos a iniciales si no hay foto de perfil.
  // El frontend puede extenderse después si la búsqueda trae fotos de trabajos.

  // Priority 3: Avatar con iniciales sobre fondo cálido
  const nombre = r.nombre || "";
  const iniciales = nombre
    .split(" ")
    .map((n) => n[0] || "")
    .slice(0, 2)
    .join("");

  return {
    type: "iniciales" as const,
    url: undefined,
    iniciales,
    color: "#0F6B5C",
  };
}

/** Devuelve la clase CSS del avatar según su tipo. */
function avatarCls(tipo: "perfil" | "trabajo" | "iniciales"): string {
  if (tipo === "perfil") {
    return "rounded-full w-12 h-12 object-cover border-2 border-[#FBF7F0] ring-4 ring-[#0F6B5C]";
  }
  if (tipo === "trabajo") {
    return "rounded-full w-12 h-12 object-cover border-2 border-[#FBF7F0] ring-2 ring-[#0F6B5C]/20";
  }
  return "rounded-full w-12 h-12 bg-[#FBF7F0] text-[#0F6B5C] flex items-center justify-center text-sm font-semibold";
}

export function TarjetaResultado({ r }: { r: ResultadoBusqueda }) {
  const perfil = `/${r.slug}`;
  const textoVisita = r.precioVisita != null ? `Visita desde ${pesos.format(r.precioVisita)}` : r.visitaAConvenir ? "Visita a convenir" : null;
  const distintivos = [
    ...(r.atiendeUrgencias ? [{ k: "urg", t: "Atiende urgencias", c: "bg-piedra text-tinta-2" }] : []),
    ...(r.disponible24h ? [{ k: "24h", t: "24 horas", c: "bg-piedra text-tinta-2" }] : []),
    ...r.insignias.map((i) => ({ k: i.clave, t: i.nombre, c: TONO_INSIGNIA[i.clave] ?? "bg-piedra text-tinta-2" })),
  ];

  const avatar = avatarInfoFromBusqueda(r);
  const cls = avatarCls(avatar.type);

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-borde-suave bg-white p-4 shadow-[0_2px_10px_rgba(27,38,35,0.05)]">
      <Link href={perfil} className="flex min-w-0 flex-col gap-2 text-tinta">
        {/* Avatar circular en la cabecera */}
        <div className="flex items-center justify-center mb-3">
          <span className={cls} aria-label={`Foto de ${r.nombre}`}>
            {avatar.type === "iniciales" ? (
              <>
                {avatar.iniciales}
              </>
            ) : avatar.type === "perfil" ? (
              <img
                src={avatar.url}
                alt={`Foto de perfil de ${r.nombre}`}
                className="rounded-full w-full h-full object-cover"
              />
            ) : null}
            {avatar.type === "iniciales" && (
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#0F6B5C] rounded-full opacity-80" aria-hidden="true" />
            )}
          </span>
        </div>

        <b className="font-display text-xl font-bold leading-tight">{r.nombre}</b>
        <NivelPerfilMarca nivel={r.nivel} />
        {r.localidades.length > 0 && <span className="line-clamp-1 text-sm text-gris">{r.localidades.join(", ")}</span>}
      </Link>
    </article>
  );
}