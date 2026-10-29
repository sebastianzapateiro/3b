/**
 * Pantallazos de ejemplo para «¿Cómo funciona?»: reproducen con HTML las pantallas reales del portal
 * (buscador, tarjeta de resultado, perfil, WhatsApp, reseña, ingreso, panel y verificación).
 * Son decorativos (aria-hidden): el paso se entiende por su título y su texto. Los nombres son de ejemplo.
 */
import type { IconoPaso } from "@/lib/como-funciona.content";

const linea = (w: string, c = "bg-piedra") => <span className={`block h-2 rounded-full ${c}`} style={{ width: w }} />;
const campo = "flex h-8 items-center rounded-lg border border-borde-campo bg-white px-2.5 text-[12px] text-tinta";
const chip = "inline-flex h-6 items-center rounded-full bg-verde-claro px-2 text-[10.5px] font-semibold text-verde-oscuro";
const marco = "w-full max-w-[232px] overflow-hidden rounded-[18px] border border-borde bg-crema text-left text-tinta shadow-[0_10px_28px_rgb(0_0_0/.22)]";

function Barra({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-borde-suave bg-white px-3 py-2">
      <span className="flex gap-1"><i className="size-1.5 rounded-full bg-ladrillo" /><i className="size-1.5 rounded-full bg-amarillo" /><i className="size-1.5 rounded-full bg-verde" /></span>
      <span className="ml-1 truncate rounded-md bg-piedra px-2 py-0.5 text-[10px] text-tinta-2">{url}</span>
    </div>
  );
}

const Estrellas = ({ n = 5 }: { n?: number }) => <span className="text-[13px] tracking-tight text-amarillo">{"★".repeat(n)}<span className="text-borde">{"★".repeat(5 - n)}</span></span>;

function Pantalla({ icono }: { icono: IconoPaso }) {
  switch (icono) {
    case "lupa":
      return (
        <div className={marco}><Barra url="lastresb.com.co" />
          <div className="flex flex-col gap-2 p-3">
            <b className="font-display text-[15px] leading-tight">¿Qué servicio necesitas?</b>
            <span className={campo}>plomero</span>
            <span className={campo}>Suba</span>
            <span className="flex h-8 items-center justify-center rounded-lg bg-tinta text-[12px] font-semibold text-white">Buscar</span>
            <span className="flex flex-wrap gap-1"><i className={`${chip} not-italic`}>Plomería</i><i className={`${chip} not-italic`}>Inglés</i><i className={`${chip} not-italic`}>Mudanzas</i></span>
          </div>
        </div>
      );
    case "tarjeta":
      return (
        <div className={marco}><Barra url="lastresb.com.co/buscar" />
          <div className="flex flex-col gap-2 p-3">
            <span className="text-[11px] text-tinta-2">3 proveedores en Suba</span>
            {[["LM", "Laura Mendoza", "4,9", "bg-verde-claro"], ["CR", "Carlos Rojas", "4,7", "bg-amarillo-suave"]].map(([i, n, c, f]) => (
              <div key={n} className="flex flex-col gap-1.5 rounded-xl border border-borde-suave bg-white p-2">
                <div className="flex items-center gap-2">
                  <span className={`flex size-8 flex-none items-center justify-center rounded-lg text-[11px] font-bold ${f}`}>{i}</span>
                  <span className="flex flex-col leading-tight"><b className="text-[12px]">{n}</b><span className="text-[10.5px] text-tinta-2"><Estrellas n={5} /> {c}</span></span>
                </div>
                <span className="flex gap-1"><i className={`${chip} not-italic`}>Identidad verificada</i></span>
              </div>
            ))}
          </div>
        </div>
      );
    case "fotos":
      return (
        <div className={marco}><Barra url="lastresb.com.co/laura-mendoza" />
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-verde-claro text-[12px] font-bold text-verde-oscuro">LM</span><span className="leading-tight"><b className="block text-[12.5px]">Laura Mendoza</b><span className="text-[10.5px] text-tinta-2"><Estrellas /> 4,9 · 32 reseñas</span></span></div>
            <b className="text-[11px]">Trabajos</b>
            <div className="grid grid-cols-3 gap-1.5">
              {["from-verde to-verde-vivo", "from-ladrillo to-ladrillo-claro", "from-amarillo to-amarillo-suave", "from-tinta to-verde", "from-ladrillo-claro to-amarillo", "from-verde-vivo to-verde-claro"].map((g) => <span key={g} className={`aspect-square rounded-lg bg-gradient-to-br ${g}`} />)}
            </div>
            <div className="flex flex-col gap-1">{linea("90%")}{linea("70%")}</div>
          </div>
        </div>
      );
    case "chat":
      return (
        <div className={marco}>
          <div className="flex items-center gap-2 bg-verde px-3 py-2 text-white"><span className="flex size-6 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">LM</span><b className="text-[12px]">Laura Mendoza</b></div>
          <div className="flex flex-col gap-1.5 bg-[#EFE9DD] p-3 text-[11.5px] leading-snug">
            <span className="self-end rounded-xl rounded-tr-sm bg-[#D9F2D0] px-2.5 py-1.5">Hola Laura, vi tu perfil en LasTresB. Necesito clases de inglés.</span>
            <span className="self-start rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5">¡Hola! Claro, ¿para qué nivel?</span>
            <span className="self-end rounded-xl rounded-tr-sm bg-[#D9F2D0] px-2.5 py-1.5">Intermedio. ¿Cuánto vale y cuándo podemos empezar?</span>
          </div>
          <div className="flex h-9 items-center justify-center gap-1.5 bg-verde text-[12px] font-semibold text-white">Escribir por WhatsApp</div>
        </div>
      );
    case "estrella":
      return (
        <div className={marco}><Barra url="lastresb.com.co/laura/calificar" />
          <div className="flex flex-col gap-2 p-3">
            <b className="font-display text-[14px] leading-tight">¿Cómo te fue con Laura?</b>
            <span className="text-[22px] leading-none text-amarillo">★★★★<span className="text-borde">★</span></span>
            <span className="rounded-lg border border-borde-campo bg-white p-2 text-[11px] leading-snug text-tinta-2">Llegó puntual y explicó muy claro. Repetiría.</span>
            <span className="flex h-8 items-center justify-center rounded-lg bg-tinta text-[12px] font-semibold text-white">Publicar reseña</span>
          </div>
        </div>
      );
    case "usuario":
      return (
        <div className={marco}><Barra url="lastresb.com.co/ingreso" />
          <div className="flex flex-col gap-2 p-3">
            <b className="font-display text-[14px] leading-tight">¿Cómo quieres usar LasTresB?</b>
            <span className="rounded-xl border border-borde-campo bg-white p-2 text-[11.5px]"><b>Soy cliente</b><br /><span className="text-tinta-2">Busco un servicio</span></span>
            <span className="rounded-xl border-2 border-tinta bg-white p-2 text-[11.5px]"><b>Soy proveedor</b><br /><span className="text-tinta-2">Ofrezco un servicio</span></span>
            <span className="flex h-8 items-center justify-center rounded-lg border border-borde-campo bg-white text-[12px] font-semibold">Continuar con Google</span>
          </div>
        </div>
      );
    case "perfil":
      return (
        <div className={marco}><Barra url="lastresb.com.co/panel/perfil" />
          <div className="flex flex-col gap-2 p-3">
            <b className="text-[11px]">Tus servicios</b>
            <span className="flex flex-wrap gap-1"><i className={`${chip} not-italic`}>✓ Inglés</i><i className={`${chip} not-italic`}>✓ Refuerzo</i></span>
            <b className="text-[11px]">Localidades</b>
            <span className="flex flex-wrap gap-1"><i className={`${chip} not-italic`}>✓ Suba</i><i className={`${chip} not-italic`}>✓ Usaquén</i></span>
            <b className="text-[11px]">Fotos de tus trabajos</b>
            <div className="grid grid-cols-3 gap-1.5"><span className="aspect-square rounded-lg bg-gradient-to-br from-verde to-verde-vivo" /><span className="aspect-square rounded-lg bg-gradient-to-br from-ladrillo to-ladrillo-claro" /><span className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-borde-campo text-[16px] text-gris">+</span></div>
          </div>
        </div>
      );
    case "escudo":
      return (
        <div className={marco}><Barra url="lastresb.com.co/panel" />
          <div className="flex flex-col gap-2 p-3">
            <span className="inline-flex h-6 w-fit items-center rounded-full bg-amarillo-suave px-2.5 text-[10.5px] font-bold text-amarillo-oscuro">En revisión</span>
            {["Documento de identidad", "WhatsApp confirmado", "RUT (si aplica)"].map((t, i) => (
              <span key={t} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[11.5px]"><span className={`flex size-4 flex-none items-center justify-center rounded-full text-[10px] font-bold ${i < 2 ? "bg-verde text-white" : "bg-piedra text-tinta-2"}`}>{i < 2 ? "✓" : "…"}</span>{t}</span>
            ))}
            <span className="text-[10.5px] leading-snug text-tinta-2">Cuando el equipo lo apruebe, tu página se publica.</span>
          </div>
        </div>
      );
    case "qr":
      return (
        <div className={marco}><Barra url="lastresb.com.co/tunombre" />
          <div className="flex items-center gap-3 p-3">
            <span aria-hidden="true" className="grid size-[84px] flex-none grid-cols-7 gap-px rounded-lg bg-white p-1.5">
              {Array.from({ length: 49 }, (_, i) => <i key={i} className={`rounded-[1px] ${[0,1,2,4,5,6,7,9,11,13,14,16,18,19,20,22,24,26,28,30,32,34,35,36,38,40,42,43,44,46,48,10,25,33].includes(i) ? "bg-tinta" : "bg-transparent"}`} />)}
            </span>
            <span className="flex flex-col gap-1 text-[11px] leading-snug"><b className="text-[12px]">Tu página</b><span className="break-all text-verde">lastresb.com.co/ tunombre</span><span className="text-tinta-2">Para volantes y redes.</span></span>
          </div>
        </div>
      );
  }
}

export function Pantallazo({ icono, sobreClaro }: { icono: IconoPaso; sobreClaro?: boolean }) {
  return (
    <div aria-hidden="true" className="flex w-full flex-col items-center gap-1.5">
      {/* Se agranda el pantallazo para que el color solo asome como marco. */}
      <div className="flex w-full justify-center [zoom:1.1] sm:[zoom:1.35]"><Pantalla icono={icono} /></div>
      <span className={`text-xs font-semibold ${sobreClaro ? "text-tinta" : "text-white/90"}`}>Así se ve en LasTresB</span>
    </div>
  );
}
