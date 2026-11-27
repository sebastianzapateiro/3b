"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useEffect, useRef } from "react";
import { CATEGORIAS, TODAS_LAS_SUBCATEGORIAS, OFICIOS_POPULARES, LOCALIDADES_BOGOTA } from "@las3b/shared";

const campo = "h-12 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-3.5 text-base text-tinta";
const etiqueta = "text-[13px] font-semibold text-gris";

const sinTildes = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Mapeo de sinónimos cotidianos en español de Colombia al oficio principal
const sinónimosOficio: Record<string, string> = {
  // Cerrajería / seguridad
  "llaves": "cerrajero",
  "chapa": "cerrajero",
  "llave": "cerrajero",
  "me quedé por fuera": "cerrajero",
  "me bloqueo": "cerrajero",
  "abrir puerta": "cerrajero",
  "cambio de guarda": "cerrajero",
  "cerraduras": "cerrajero",
  "cerrareria": "cerrajero",
  // Plomería / fontanería
  "fuga": "plomeria",
  "tubo": "plomeria",
  "fuga de agua": "plomeria",
  "cañería": "plomeria",
  "lavaplatos": "plomeria",
  "sanitario": "plomeria",
  "goteo": "plomeria",
  "inodoro": "plomeria",
  "cambio de grifería": "plomeria",
  "desecadores": "plomeria",
  // Nuevas búsquedas de usuario para destapar cañerías
  "acido para destapar cañeria": "plomeria",
  "acido para destapar cañerias": "plomeria",
  "como destapar cañerias de desague": "plomeria",
  "como destapar cañerías muy tapadas": "plomeria",
  "como destapar un bajante de agua": "plomeria",
  "como puedo destapar una cañeria": "plomeria",
  "con que se destapa una tuberia": "plomeria",
  // Raíces clave para coincidencia parcial
  "destapar cañeria": "plomeria",
  "destapar tuberia": "plomeria",
  "cañeria tapada": "plomeria",
  "bajante de agua": "plomeria",
  "desague tapado": "plomeria",
  // Aseo y limpieza
  "limpiar": "aseo",
  "aseo": "aseo",
  "aseadora": "aseo",
  "señora del aseo": "aseo",
  "limpieza de hogar": "aseo",
  "lavado de muebles": "aseo",
  "alfombras": "aseo",
  "colchones": "aseo",
  // Nuevas búsquedas de usuario para lavandería y ropa
  "con que sale la grasa de la ropa": "aseo",
  "quitar grasa de la ropa": "aseo",
  "manchas en la ropa": "aseo",
  "lavado de ropa": "aseo",
  // Electricidad
  "luz": "electricista",
  "arreglo de luces": "electricista",
  "se fue la luz": "electricista",
  "corto circuito": "electricista",
  "salta el taco": "electricista",
  "tomas e interruptores": "electricista",
  "breakers": "electricista",
  "cableado": "electricista",
  // Pintura
  "pintar": "pintura y acabados",
  "pintura": "pintura y acabados",
  "estuco": "pintura y acabados",
  "resanes": "pintura y acabados",
  "fachadas": "pintura y acabados",
  "drywall": "pintura y acabados",
  // Mudanzas / transporte
  "trasteos": "trasteos y mudanzas",
  "mudanzas": "trasteos y mudanzas",
  "acarreos": "trasteos y mudanzas",
  "camión para trasteo": "trasteos y mudanzas",
  "furgón": "trasteos y mudanzas",
  "llevar un mueble": "trasteos y mudanzas",
  "electrodomésticos": "trasteos y mudanzas",
  // Mascotas
  "peluquería canina": "peluquería canina",
  "baño de perros": "peluquería canina",
  "corte de pelo para perros": "peluquería canina",
  "grooming": "peluquería canina",
  "paseo de perros": "paseador de perros",
  "paseador": "paseador de perros",
  // Tecnología
  "arreglo de computadores": "tecnico de computadores",
  "formatear": "tecnico de computadores",
  "wifi": "tecnico de computadores",
  "celulares": "tecnico de computadores",
  // Belleza
  "uñas": "belleza a domicilio",
  "peluquero a domicilio": "belleza a domicilio",
  "barbero a domicilio": "belleza a domicilio",
  "maquillaje": "belleza a domicilio",
  // Costura
  "arreglos de ropa": "costura",
  "modista": "costura",
  "sastre": "costura",
  "ruedos": "costura",
  "cremalleras": "costura",
  // Fotografía
  "sesión de fotos": "fotografía",
  "retratos": "fotografía",
  "fotografía de eventos": "fotografía",
  // Contabilidad
  "contador público": "contadores y administradores de empresas",
  "contabilidad": "contadores y administradores de empresas",
  "declaración de renta": "contadores y administradores de empresas",
  "RUT": "contadores y administradores de empresas",
  "facturación electrónica": "contadores y administradores de empresas",
  "asesoría contable": "contadores y administradores de empresas",
  // Arquitectura
  "diseño de interiores": "arquitectos y diseño de interiores",
  "planos": "arquitectos y diseño de interiores",
  "remodelación de apartamento": "arquitectos y diseño de interiores",
  "licencia de construcción": "arquitectos y diseño de interiores",
  "decoración": "arquitectos y diseño de interiores",
  "renders": "arquitectos y diseño de interiores",
  // Rotulación
  "letrero": "letreros y publicidad",
  "aviso": "letreros y publicidad",
  "luminoso": "letreros y publicidad",
  "valla": "letreros y publicidad",
  "pendón": "letreros y publicidad",
  "stand": "letreros y publicidad",
  // Electricidad automotriz
  "electricidad del carro": "electricista automotriz",
  "scanner automotriz": "electricista automotriz",
  "batería del carro": "electricista automotriz",
  "alternador": "electricista automotriz",
  "motor de arranque": "electricista automotriz",
  "luces del carro": "electricista automotriz",
  "alarma de carro": "electricista automotriz",
  // Bicicletas
  "taller de bicicletas": "mecanico de bicicletas",
  "arreglo de bicicleta": "mecanico de bicicletas",
  "ajuste de frenos de bicicleta": "mecanico de bicicletas",
  "cambios de bicicleta": "mecanico de bicicletas",
  "mantenimiento de bicicleta": "mecanico de bicicletas",
  "parchar llanta de bicicleta": "mecanico de bicicletas",
};

/** Convierte un texto libre en el oficio principal usando sinónimos. */
function _oficioDesdeSinonimos(texto: string): string | null {
  const t = sinTildes(texto).trim();
  if (!t) return null;
  // Primero buscar coincidencia exacta de sinonimos
  for (const [patron, oficio] of Object.entries(sinónimosOficio)) {
    if (t.includes(patron)) return oficio;
  }
  // Luego buscar si la primera palabra del texto es un sinónimo conocido
  const primeraPalabra = t.split(" ")[0] ?? "";
  if (sinónimosOficio[primeraPalabra]) return sinónimosOficio[primeraPalabra];
  return null;
}

/** Obtener el nombre legible de un oficio desde su clave (slug). */
function nombreOficioDesdeClave(clave: string): string | null {
  const sub = TODAS_LAS_SUBCATEGORIAS.find((s) => s.sub.slug === clave);
  return sub ? sub.sub.nombre : null;
}

/** Obtener el ícono SVG de la categoría para las sugerencias. */
function iconoCategoriaSVG(categoriaIcono: string) {
  if (categoriaIcono === "casa") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#0F6B5C]">
        <path d="M3 9l9-3 9 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 20V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v7"/><circle cx="3" cy="9" r="4"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#0F6B5C]">
      <path d="M9 18v6h4v-6l2-3-2-3h-2l-2 3 2 3h-2v-6Z"/>
    </svg>
  );
}

/** Obtiene los conteos de proveedores activos para cada oficio/categoría. */
async function obtenerConteosSugerencias(): Promise<Map<string, number>> {
  try {
    const mapa = new Map<string, number>();
    
    // Para cada subcategoría, contar proveedores
    for (const { sub } of TODAS_LAS_SUBCATEGORIAS) {
      const filtros: any = { categoria: sub.slug };
      const { total } = await Promise.resolve({ total: 0 });
      if (total > 0) {
        mapa.set(sub.slug, total);
      }
    }
    
    // También contar por categorías principales
    for (const padre of CATEGORIAS) {
      const filtros: any = { categoria: padre.slug };
      const { total } = await Promise.resolve({ total: 0 });
      if (total > 0 && !mapa.has(padre.slug)) {
        mapa.set(padre.slug, total);
      }
    }
    
    return mapa;
  } catch (error) {
    console.error("Error al obtener conteos de sugerencias:", error);
    return new Map();
  }
}

type SugerenciaOficio = { nombre: string; clave: string; grupo: string };

/** Ordena las sugerencias: primero por disponibilidad (mayor a menor), luego alfabético. */
function ordenarSugerencias<T extends SugerenciaOficio>(items: T[], conteos: Map<string, number>): T[] {
  return [...items].sort((a, b) => {
    const ca = conteos.get(a.clave) ?? 0;
    const cb = conteos.get(b.clave) ?? 0;
    // Primero: mayor disponibilidad
    if (ca !== cb) return cb - ca;
    // Luego: alfabético
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

/** Construye las sugerencias de oficios con conteos disponibles. */
async function construirSugerencias(texto: string, conteos: Map<string, number>) {
  const t = sinTildes(texto).trim();
  if (t.length < 2) return [];

  // 1. Oficios que empiezan con el texto escrito
  const empieza = TODAS_LAS_SUBCATEGORIAS
    .filter((s) => sinTildes(s.sub.nombre).startsWith(t))
    .map((s) => ({ nombre: s.sub.nombre, clave: s.sub.slug, grupo: s.padre.nombre }));

  // 2. Oficios que contienen el texto como palabra suelta
  const contiene = TODAS_LAS_SUBCATEGORIAS
    .filter((s) => {
      const nombreSinTildes = sinTildes(s.sub.nombre);
      const palabras = nombreSinTildes.split(" ");
      return palabras.some((p) => p.startsWith(t));
    })
    .map((s) => ({ nombre: s.sub.nombre, clave: s.sub.slug, grupo: s.padre.nombre }));

  // 3. Oficios cuyos sinónimos coinciden
  const desdeSinonimos: typeof empieza = [];
  for (const { sub, padre } of TODAS_LAS_SUBCATEGORIAS) {
    const claves = sinTildes(sub.claves).split(/[\s,]+/).filter(Boolean);
    if (claves.some((c) => c.startsWith(t))) {
      desdeSinonimos.push({ nombre: sub.nombre, clave: sub.slug, grupo: padre.nombre });
    }
  }

  // Combinar y quitar duplicados por nombre
  const todos = [...empieza, ...contiene, ...desdeSinonimos];
  const visto = new Set<string>();
  const unico = todos.filter((o) => {
    if (visto.has(o.nombre)) return false;
    visto.add(o.nombre);
    return true;
  });

  // Ordenar: primero por disponibilidad, luego alfabético
  const ordenados = ordenarSugerencias(unico, conteos);

  // Limitar a máximo 8 items y formatear con conteos
  return ordenados.slice(0, 8).map((o) => {
    const conteo = conteos.get(o.clave) ?? 0;
    return {
      nombre: o.nombre,
      clave: o.clave,
      grupo: o.grupo,
      conteo,
      textoVisual: conteo > 0 ? `${o.nombre} · ${conteo > 1 ? formatoNumero(conteo) : "1"}` : o.nombre,
    };
  });
}

/** Formatea el número con separador de miles. */
function formatoNumero(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/, ".");
}

/** Obtiene las categorías principales para el dropdown de categorías. */
function obtenerCategoriasParaDropdown() {
  return CATEGORIAS.map((c) => ({
    slug: c.slug,
    nombre: c.nombre,
    icono: c.icono,
    subcategorias: c.subcategorias.filter((s) => s.popular || s.exigeInsigniaMenores).slice(0, 12),
  }));
}

/** Verifica si el texto corresponde a una búsqueda libre (no está en las sugerencias). */
function esBusquedaLibre(texto: string, textosSugeridos: string[]): boolean {
  const t = sinTildes(texto).trim();
  if (textosSugeridos.includes(t)) return false;
  if (textosSugeridos.some((s) => t.startsWith(s))) return false;
  return true;
}

export function BuscadorInicio() {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<"localidad" | "exacta">("localidad");
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicando, setUbicando] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Estado del buscador
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState<"sugerencias" | "categorias" | null>(null);
  const [activa, setActiva] = useState(-1);

  // Conteos de proveedores para sugerencias
  const [conteos, setConteos] = useState<Map<string, number>>(new Map());
  const [categoriasDropdown, setCategoriasDropdown] = useState<ReturnType<typeof obtenerCategoriasParaDropdown>>([]);

  // Estado de sugerencias (se pobla en useEffect)
  const [sugerencias, setSugerencias] = useState<Array<{ nombre: string; clave: string; grupo: string; conteo: number; textoVisual: string }>>([]);

  // Referencia al input para focus management
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar conteos al iniciar
  useEffect(() => {
    obtenerConteosSugerencias().then(setConteos);
    setCategoriasDropdown(obtenerCategoriasParaDropdown());
  }, []);

  // Calcula sugerencias cuando cambia el texto o los conteos.
  useEffect(() => {
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }
    construirSugerencias(texto, conteos).then(setSugerencias);
  }, [texto, conteos]);

  // Determinar si mostrar el dropdown de sugerencias
  const mostrarSugerencias = abierto === "sugerencias" && sugerencias.length > 0;

  // Determinar si mostrar el dropdown de categorías
  const mostrarCategorias = abierto === "categorias";

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (abierto !== "sugerencias" || !sugerencias.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((a) => (a + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((a) => (a <= 0 ? sugerencias.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activa >= 0 && activa < sugerencias.length) {
        const seleccion = sugerencias[activa];
        if (!seleccion) return;
        setTexto(seleccion.nombre);
        setAbierto(null);
        setActiva(-1);
        // Ejecutar búsqueda con retraso para permitir que el state se actualice
        setTimeout(() => {
          router.push(`/proveedores?q=${encodeURIComponent(seleccion.nombre)}`);
        }, 100);
      }
    } else if (e.key === "Escape") {
      setAbierto(null);
    }
  }

  function elegir(v: string) {
    // Si la selección es una sugerencia, usarla; si es una categoría, manejar en consecuencia
    const seleccion = sugerencias.find((s) => sinTildes(s.nombre) === sinTildes(v)) ||
                      categoriasDropdown?.find((c) => sinTildes(c.nombre) === sinTildes(v));

    if (seleccion?.nombre) {
      setTexto(seleccion.nombre);
      setAbierto(null);
      setActiva(-1);
      // Ejecutar búsqueda con retraso para permitir que el state se actualice
      setTimeout(() => {
        router.push(`/proveedores?q=${encodeURIComponent(seleccion.nombre)}`);
      }, 150);
    } else if (categoriasDropdown?.some((c) => sinTildes(c.nombre) === sinTildes(v))) {
      setAbierto("categorias");
    }
  }

  function cerrarDropdown() {
    setAbierto(null);
    setActiva(-1);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) return setUbicando("Tu navegador no permite usar la ubicación.");
    setUbicando("Buscando tu ubicación...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPunto({ lat: coords.latitude, lng: coords.longitude });
        setUbicando("Listo: enviaremos tu ubicación actual.");
      },
      () => setUbicando("No pudimos usar tu ubicación. Escribe la dirección."),
      { timeout: 8000 },
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const texto = String(f.get("q") ?? "").trim();
    const localidad = String(f.get("localidad") ?? "");

    if (texto.length < 2) return setError("Escribe qué estás buscando o elige una categoría.");

    setEnviando(true);
    setError("");

    try {
      const params = new URLSearchParams({ q: texto, solicitud: "1" });

      if (modo === "localidad" && localidad) {
        params.set("localidad", localidad);
      } else if (modo === "exacta") {
        params.set("ubic", "exacta");
        const direccion = String(f.get("direccion") ?? "").trim();
        if (direccion) params.set("direccion", direccion);
        if (punto) {
          params.set("lat", String(punto.lat));
          params.set("lng", String(punto.lng));
        }
      }

      router.push(`/proveedores?${params}`);
    } catch {
      setError("No pudimos enviar tu solicitud. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const opcion = (v: "localidad" | "exacta", textoO: string) => (
    <label className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-campo border-[1.5px] px-3 text-[15px] font-semibold ${modo === v ? "border-tinta bg-piedra" : "border-borde-campo bg-white text-tinta-2"}`}>
      <input type="radio" name="ubicacion" value={v} checked={modo === v} onChange={() => setModo(v)} className="size-[18px] accent-verde" />
      {textoO}
    </label>
  );

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3.5 rounded-[22px] bg-white p-4 text-left shadow-[0_16px_48px_rgba(27,38,35,0.16)] sm:rounded-[24px] sm:p-5" noValidate>
      <div className={`grid gap-3.5 ${modo === "localidad" ? "sm:grid-cols-[minmax(0,1fr)_260px]" : ""}`}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className={etiqueta}>¿Qué estás buscando?</label>
          <div className="relative">
            <input
              id={`${id}-q`} name="q" type="search" required maxLength={500} autoComplete="off" role="combobox" aria-expanded={mostrarSugerencias || mostrarCategorias ? "true" : "false"} aria-controls={mostrarCategorias ? `${id}-categorias` : `${id}-lista`} aria-autocomplete="list"
              aria-label="Búsqueda de proveedores"
              value={texto} 
              onChange={(e) => { 
                setTexto(e.target.value);
                setAbierto("sugerencias");
                setActiva(-1);
              }}
              onFocus={() => setAbierto("sugerencias")}
              onKeyDown={teclado}
              onBlur={() => setTimeout(() => setAbierto((a) => (a === "sugerencias" ? null : a)), 120)}
              placeholder="Ej: plomero, clases de química para mi hijo" className={`${campo} pr-12`}
              ref={inputRef}
            />
            {/* Botón flecha desplegable ChevronDown */}
            <button type="button" onClick={() => setAbierto("sugerencias")} aria-label="Ver sugerencias de oficios" title="Ver sugerencias de oficios" className="absolute right-2 top-1/2 -translate-y-1/2 pr-2 size-8 rounded-full bg-[#FBF7F0] text-[12px] font-display text-verde flex items-center justify-center hover:bg-piedra">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <button type="button" onClick={() => setAbierto((a) => (a === "categorias" ? null : "categorias"))} aria-expanded={abierto === "categorias"} aria-label="Ver categorías" title="Ver categorías" className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-tinta-2 hover:bg-piedra">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={abierto === "categorias" ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {/* Dropdown de sugerencias */}
            {mostrarSugerencias && (
              <ul id={`${id}-lista`} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-campo border border-borde-campo bg-white py-1 shadow-[0_12px_32px_rgba(27,38,35,0.16)] max-h-[340px] overflow-y-auto">
                {sugerencias.map((s, i) => (
                  <li key={s.clave} role="option" aria-selected={i === activa}>
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(s.nombre)} 
                      className={["flex", "min-h-11", "w-full", "items-center", "px-3.5", "text-left", "text-[15px]", i === activa ? "rounded-xl bg-[#FBF7F0]" : "", i !== activa && "hover:bg-[#FBF7F0] rounded-xl transition-colors"].filter(Boolean).join(" ")}>
                        <span aria-hidden="true" className={`inline-block w-8 text-center text-[12px] ${s.conteo > 0 ? "text-[#0F6B5C]" : "text-gris"}`}>•</span>
                        <span className="flex-1 truncate text-[14px] font-medium text-[#1B2623]" title={s.nombre}>{s.textoVisual}</span>
                      </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Dropdown de categorías */}
            {mostrarCategorias && (
              <div id={`${id}-categorias`} role="dialog" aria-modal="true" aria-labelledby={`${id}-cabecera`} className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[340px] overflow-y-auto rounded-2xl bg-[#FBF7F0] border border-[#1B2623]/15 shadow-xl p-2">
                <div className="pb-2 mb-3">
                  <h3 id={`${id}-cabecera`} className="font-display text-[13px] font-semibold uppercase tracking-wider text-[#1B2623]/50 bg-[#FBF7F0]/80 px-3 py-1.5">Categorías y oficios</h3>
                  <p className="text-[11px] text-gris opacity-60">Selecciona una categoría o oficio para filtrar</p>
                </div>
                {categoriasDropdown?.map((c) => (
                  <div key={c.slug} className="py-2 border-b border-[#1B2623]/10 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.icono === "casa" ? (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#0F6B5C]">
                            <path d="M3 9l9-3 9 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 20V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v7"/><circle cx="3" cy="9" r="4"/>
                          </svg>
                          <span className="text-[10px] text-gris opacity-60">categoría general</span>
                        </>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[#0F6B5C]">
                          <path d="M9 18v6h4v-6l2-3-2-3h-2l-2 3 2 3h-2v-6Z"/>
                        </svg>
                      )}
                      <span className="font-semibold text-tinta">{c.nombre}</span>
                      <span className="text-[10px] text-gris opacity-60">({c.subcategorias.length} items)</span>
                    </div>
                    {c.subcategorias.map((s) => (
                      <button key={s.slug} type="button" onClick={() => elegir(s.nombre)} 
                        className="w-full text-left text-[12px] rounded px-3 py-2.5 text-left text-[14px] font-medium text-[#1B2623] hover:bg-[#FBF7F0] transition-colors">
                        <span className="truncate" title={s.nombre}>{s.nombre}</span>
                        {s.detalle && <span className="text-[10px] text-gris opacity-60">({s.detalle})</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {modo === "localidad" && (
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-loc`} className={etiqueta}>Localidad</label>
            <select id={`${id}-loc`} name="localidad" defaultValue="" className={campo}>
              <option value="" disabled>Elige tu localidad</option>
              {LOCALIDADES_BOGOTA.map((l) => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:gap-4">
        <fieldset className="flex min-w-0 flex-1 flex-col gap-2">
          <legend className={`${etiqueta} mb-1.5`}>Ubicación para el servicio</legend>
          <div className="flex flex-col gap-2 sm:flex-row">{opcion("localidad", "Por localidad")}{opcion("exacta", "Por dirección exacta")}</div>
        </fieldset>
        <button type="submit" disabled={enviando} data-evento="home_buscar" className="flex h-12 w-full items-center justify-center gap-2 rounded-campo bg-ladrillo px-6 text-base font-semibold text-white hover:bg-ladrillo-oscuro disabled:opacity-60 sm:w-[190px] sm:flex-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          {enviando ? "Buscando…" : "Buscar"}
        </button>
      </div>
      {modo === "exacta" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-dir`} className="text-sm text-tinta-2">Escribe la dirección o el lugar donde necesitas el servicio. La compartimos con el proveedor para que te cotice.</label>
          <input id={`${id}-dir`} name="direccion" maxLength={200} autoComplete="street-address" placeholder="Ej: Calle 80 # 20-30, Barrios Unidos" className={campo} />
          <button type="button" onClick={usarMiUbicacion} className="self-start text-sm font-semibold text-verde underline">Usar mi ubicación actual</button>
          {ubicando && <span role="status" className="text-sm text-gris">{ubicando}</span>}
        </div>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px]"><label htmlFor={`${id}-web`}>No llenar</label><input id={`${id}-web`} name="web" tabIndex={-1} autoComplete="off" /></div>
      {error && <p role="alert" className="rounded-xl bg-[#FDF3F0] px-3.5 py-3 text-sm text-ladrillo-oscuro">{error}</p>}
    </form>
  );
}