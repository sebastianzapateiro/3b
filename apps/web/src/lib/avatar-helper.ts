/**
 * Avatar helper: resolves the best available image for a provider's avatar
 * using a cascading fallback priority:
 *  1) Foto de perfil principal del proveedor (fotoPerfil)
 *  2) Primera foto válida de sus fotos de referencia/portafolio de trabajos
 *  3) Avatar circular con iniciales sobre fondo cálido (paleta LasTresB)
 *
 * Este helper es usado tanto en TarjetaResultado como en TarjetaServicio.
 */

export interface AvatarInfo {
  type: "perfil" | "trabajo" | "iniciales";
  url?: string; // para tipo "perfil" o "trabajo"
  iniciales: string; // para tipo "iniciales"
  color: string; // color de fondo/texto (usualmente verde LasTresB)
}

/**
 * Obtiene la información del avatar basándose en los datos provistos.
 * El llamador debe pasar un objeto con las propiedades que correspondan
 * según el tipo de resultado (búsqueda o servicio).
 */
export function getAvatarInfo(
  datos: {
    /** Foto de perfil principal del proveedor (desde ResultadoBusqueda.fotoPerfil o ResultadoServicio.proveedor.fotoPerfil) */
    fotoPerfil?: string | null;
    /** Primera foto de trabajos/portafolio (arreglo opcional) */
    fotos_trabajos?: { url?: string; ruta?: string }[];
    /** Nombre del proveedor (para iniciales cuando no hay foto) */
    nombre?: string;
  }
): AvatarInfo {
  // Priority 1: Foto de perfil principal
  if (datos.fotoPerfil) {
    return {
      type: "perfil",
      url: datos.fotoPerfil,
      iniciales: "",
      color: "#0F6B5C",
    };
  }

  // Priority 2: Primera foto de trabajos/portafolio
  if (datos.fotos_trabajos && datos.fotos_trabajos.length > 0) {
    const primera = datos.fotos_trabajos[0];
    if (primera?.url || primera?.ruta) {
      return {
        type: "trabajo",
        url: primera.url || primera.ruta,
        iniciales: "",
        color: "#0F6B5C",
      };
    }
  }

  // Priority 3: Avatar con iniciales
  const nombre = datos.nombre || "";
  const iniciales = nombre
    .split(" ")
    .map((n) => n[0] || "")
    .slice(0, 2)
    .join("");

  return {
    type: "iniciales",
    url: undefined,
    iniciales,
    color: "#0F6B5C",
  };
}

/** Devuelve la clase CSS Tailwind según el tipo de avatar. */
export function avatarClass(tipo: string): string {
  if (tipo === "perfil") {
    return "rounded-full w-12 h-12 object-cover border-2 border-[#FBF7F0] ring-4 ring-[#0F6B5C]";
  }
  if (tipo === "trabajo") {
    return "rounded-full w-12 h-12 object-cover border-2 border-[#FBF7F0] ring-2 ring-[#0F6B5C]/20";
  }
  // Iniciales: fondo cálido con iniciales en texto oscuro
  return "rounded-full w-12 h-12 bg-[#FBF7F0] text-[#0F6B5C] flex items-center justify-center text-sm font-semibold";
}