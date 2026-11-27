import Link from "next/link";
import { EtiquetaOficio } from "@/components/EtiquetaOficio";
import { NivelPerfilMarca } from "@/components/TarjetaProveedor";
import type { ResultadoServicio } from "@/lib/busqueda";
import { getAvatarInfo } from "@/lib/avatar-helper";

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const POR: Record<string, string> = {
  visita: "por visita",
  hora: "por hora",
  clase: "por clase",
  metro2: "por m²",
  trayecto: "por trayecto",
  trabajo: "por trabajo",
};

function IconoWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

/** Información del proveedor extraída de ResultadoServicio.proveedor. */
interface InfoProveedorTarjeta {
  slug: string;
  nombre: string;
  nivel: any; // NivelPerfil
  fotoPerfil: string | null;
}

/** Devuelve la información del avatar en cascada para la vista de servicios.
 *  1) Foto de perfil principal del proveedor (desde ResultadoServicio.proveedor.fotoPerfil)
 *  2) Si no tiene foto de perfil, usa automáticamente la primera foto válida de sus fotos de referencia/portafolio de trabajos
 *  3) Si no tiene ninguna foto subida todavía, muestra un avatar circular cálido con las iniciales del proveedor
 *
 * Nota: El check de `s.fotos_trabajos` está preparado para cuándo el schema lo incluya.
 * Por ahora, si no existe en el tipo, caemos directamente a las iniciales.
 */
function avatarInfoFromServicio(s: ResultadoServicio) {
  const p: InfoProveedorTarjeta = s.proveedor;

  // Priority 1: Foto de perfil principal del proveedor
  if (p?.fotoPerfil) {
    return {
      type: "perfil" as const,
      url: p.fotoPerfil,
      iniciales: "",
      color: "#0F6B5C",
    };
  }

  // Priority 2: Primera foto de trabajos/portafolio (futuro schema)
  // Usamos type assertion defensivo porque ResultadoServicio no tiene fotos_trabajos aún.
  const fotos = (s as any).fotos_trabajos;
  if (fotos && fotos.length > 0) {
    const primera = fotos[0];
    if (primera?.url || primera?.ruta) {
      return {
        type: "trabajo" as const,
        url: primera.url || primera.ruta,
        iniciales: "",
        color: "#0F6B5C",
      };
    }
  }

  // Priority 3: Avatar con iniciales sobre fondo cálido
  const nombre = p?.nombre || s.nombre || "";
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
    return "rounded-full w-14 h-14 object-cover border-2 border-[#FBF7F0] ring-2 ring-[#0F6B5C]/20";
  }
  if (tipo === "trabajo") {
    return "rounded-full w-14 h-14 object-cover border-2 border-[#FBF7F0] ring-2 ring-[#0F6B5C]/20";
  }
  // Iniciales: fondo cálido con iniciales en texto oscuro
  return "rounded-full w-14 h-14 bg-[#FBF7F0] text-[#0F6B5C] flex items-center justify-center text-sm font-semibold";
}

export function TarjetaServicio({ s }: { s: ResultadoServicio }) {
  const p = s.proveedor;
  const perfil = `/${p.slug}`;

  const avatar = avatarInfoFromServicio(s);
  const cls = avatarCls(avatar.type);

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-borde-suave bg-white p-4 shadow-[0_2px_10px_rgba(27,38,35,0.05)]">
      <div className="flex flex-col gap-2">
        {s.oficio && <EtiquetaOficio texto={s.oficio} />}

        <h3 className="font-display text-lg font-bold leading-tight text-tinta">{s.nombre}</h3>

        {s.descripcion && (
          <p className="line-clamp-2 text-sm leading-snug text-tinta-2">{s.descripcion}</p>
        )}
      </div>

      {/* Avatar circular "Lo ofrece" a la izquierda, alineado al fondo */}
      <div className="mt-3 flex items-center gap-2">
        <span className={cls}>
          {avatar.type === "iniciales" ? (
            <>
              {avatar.iniciales}
            </>
          ) : avatar.type === "perfil" ? (
            <img
              src={avatar.url}
              alt={`Foto de perfil de ${p.nombre}`}
              className="rounded-full w-full h-full object-cover"
            />
          ) : null}
        </span>

        <div>
          <span className="text-xs text-gris">Lo ofrece</span>
          <b className="truncate font-display text-base">{p?.nombre || ""}</b>
          {/* Simulamos NivelPerfilMarca con la info del proveedor */}
          {p.nivel && <span className="text-[10px] mt-1">Nivel: {String(p.nivel)}</span>}
        </div>
      </div>

      <p className="mt-3 self-start rounded-xl border border-borde-suave bg-gris-claro px-3 py-2 text-[15px] text-tinta">
        {s.precioDesde != null ? (
          <>
            <span className="text-gris">Desde </span>
            <b className="text-lg">{pesos.format(s.precioDesde)}</b>
            <span className="text-gris">{POR[s.unidad] ?? ""}</span>
          </>
        ) : (
          <b className="text-base">A convenir</b>
        )}
      </p>

      <div className="mt-3 flex gap-2">
        <Link href={perfil} className="flex h-[46px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-ladrillo bg-white text-[15px] font-semibold text-ladrillo hover:bg-coral-suave">
          Ver perfil
        </Link>

        {/* Registra el clic en `contactos` (habilita la reseña) y abre WhatsApp. */}
        <a
          href={`/api/v1/contactos/ir?p=${p.slug}&origen=busqueda`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-[14px] bg-verde text-[15px] font-semibold text-white hover:bg-verde-oscuro">
          <IconoWhatsApp />WhatsApp
        </a>
      </div>
    </article>
  );
}