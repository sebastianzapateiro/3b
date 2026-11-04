/**
 * Plantillas de los mensajes de registro y de cuenta (correo y WhatsApp), todas en un solo lugar.
 * Son funciones puras —sin base de datos ni envío— para poder probarlas y revisarlas juntas.
 * Cada correo sale en texto plano y en HTML minimalista (sin fotos): `armar` produce ambos a partir del mismo contenido.
 * Quien las usa: lib/auth.ts, lib/claves.ts, lib/invitaciones.ts, lib/avisos-proveedor.ts.
 */
import { SITIO_URL } from "@/lib/seo";

export type Mensaje = { asunto: string; texto: string; html: string };

const sitio = SITIO_URL.replace(/\/$/, "");
const saludo = (nombre?: string | null) => (nombre?.trim() ? `Hola, ${nombre.trim()}.` : "Hola.");

/** Colores de la marca (los mismos del logo). */
const C = { tinta: "#1B2623", gris: "#5B6663", borde: "#E8E2D6", fondo: "#F6F3EE", ladrillo: "#C2452D", verde: "#0F6B5C", amarillo: "#F5B700" };

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Escapa el texto y convierte los enlaces sueltos en <a>. */
const conEnlaces = (t: string) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" style="color:${C.verde};word-break:break-all">$1</a>`);

type Bloque = string | { lista: string[] };

/**
 * Arma el correo. `cuerpo`: párrafos y listas. `boton`: llamada a la acción principal; en el texto plano queda como «Texto: url».
 */
function armar(d: { asunto: string; nombre?: string | null; titulo: string; cuerpo: Bloque[]; boton?: { texto: string; url: string }; pie?: string }): Mensaje {
  const hola = saludo(d.nombre);
  const texto = [
    hola,
    ...d.cuerpo.map((b) => (typeof b === "string" ? b : b.lista.map((x) => `- ${x}`).join("\n"))),
    ...(d.boton ? [`${d.boton.texto}: ${d.boton.url}`] : []),
    ...(d.pie ? [d.pie] : []),
    "El equipo de LasTresB\nlastresb.com.co",
  ].join("\n\n");

  const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${C.tinta}">${conEnlaces(t)}</p>`;
  const cuerpoHtml = d.cuerpo
    .map((b) =>
      typeof b === "string"
        ? p(b)
        : `<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.55;color:${C.tinta}">${b.lista.map((x) => `<li style="margin:0 0 6px">${conEnlaces(x)}</li>`).join("")}</ul>`,
    )
    .join("");
  const botonHtml = d.boton
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="background:${C.tinta};border-radius:12px"><a href="${esc(d.boton.url)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none">${esc(d.boton.texto)}</a></td></tr></table>`
    : "";
  const pieHtml = d.pie ? `<p style="margin:0;font-size:13px;line-height:1.5;color:${C.gris}">${conEnlaces(d.pie)}</p>` : "";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.asunto)}</title></head>
<body style="margin:0;padding:0;background:${C.fondo};font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td style="padding:0 4px 20px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${C.tinta}">LasTres<span style="color:${C.ladrillo}">B</span><span style="font-size:12px;letter-spacing:2px;padding-left:6px;vertical-align:6px"><span style="color:${C.verde}">&#9679;</span><span style="color:${C.ladrillo}">&#9679;</span><span style="color:${C.amarillo}">&#9679;</span></span></td></tr>
<tr><td style="background:#FFFFFF;border:1px solid ${C.borde};border-radius:20px;padding:32px 28px">
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;letter-spacing:-0.4px;color:${C.tinta}">${esc(d.titulo)}</h1>
${p(hola)}${cuerpoHtml}${botonHtml}${pieHtml}
</td></tr>
<tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.5;color:${C.gris}">El equipo de LasTresB &middot; <a href="${sitio}" style="color:${C.gris}">lastresb.com.co</a><br>Gratis &middot; Sin comisiones &middot; Hecho en Bogot&aacute;</td></tr>
</table></td></tr></table></body></html>`;
  return { asunto: d.asunto, texto, html };
}

/* ───────────── Correo: cuenta ───────────── */

/** Cliente o proveedor se registra con correo: debe confirmarlo. */
export function confirmarCorreo(d: { nombre?: string | null; url: string }): Mensaje {
  return armar({ asunto: "Confirma tu correo en LasTresB", nombre: d.nombre, titulo: "Confirma tu correo", cuerpo: ["Un último paso para activar tu cuenta."], boton: { texto: "Confirmar mi correo", url: d.url }, pie: "Si no creaste una cuenta en LasTresB, ignora este correo." });
}

/** Recuperar clave (la persona lo pidió). */
export function recuperarClave(d: { nombre?: string | null; url: string }): Mensaje {
  return armar({ asunto: "Cambia tu clave de LasTresB", nombre: d.nombre, titulo: "Crea una clave nueva", cuerpo: ["Usa este enlace para elegir una clave nueva. Vence en 1 hora."], boton: { texto: "Crear clave nueva", url: d.url }, pie: "Si no lo pediste, ignora este correo: tu clave no cambia." });
}

/** El equipo creó la cuenta (alta de usuario o alta asistida de proveedor): la persona elige su clave. */
export function invitacionCuenta(d: { nombre?: string | null; motivo: string; url: string; horas: number }): Mensaje {
  return armar({ asunto: "Te crearon una cuenta en LasTresB", nombre: d.nombre, titulo: "Te crearon una cuenta", cuerpo: [d.motivo, `Elige tu clave con este enlace. Vence en ${d.horas} horas.`], boton: { texto: "Elegir mi clave", url: d.url }, pie: "Si no esperabas este correo, ignóralo." });
}

/** El equipo le asignó una clave nueva. */
export function claveCambiadaPorEquipo(d: { nombre?: string | null }): Mensaje {
  return armar({ asunto: "Cambiaron tu clave de LasTresB", nombre: d.nombre, titulo: "Cambiaron tu clave", cuerpo: ["El equipo de LasTresB te asignó una clave nueva y cerró tus sesiones abiertas."], pie: "Si no lo pediste, escríbenos de inmediato." });
}

/* ───────────── Correo: bienvenida ───────────── */

/** Cliente: al confirmar su correo. */
export function bienvenidaCliente(d: { nombre?: string | null }): Mensaje {
  return armar({
    asunto: "Bienvenido a LasTresB",
    nombre: d.nombre,
    titulo: "Bienvenido a LasTresB",
    cuerpo: ["Tu correo quedó confirmado y tu cuenta ya está lista.", { lista: ["Busca plomeros, profesores y oficios de confianza en tu localidad.", "Escríbeles directo por WhatsApp, sin comisiones.", "Califica al proveedor cuando termine el servicio."] }],
    boton: { texto: "Buscar un servicio", url: sitio },
  });
}

/** Proveedor: al confirmar su correo, con lo que sigue para publicar su página. */
export function bienvenidaProveedor(d: { nombre?: string | null }): Mensaje {
  return armar({
    asunto: "Bienvenido a LasTresB: completa tu registro",
    nombre: d.nombre,
    titulo: "Completa tu registro",
    cuerpo: [
      "Tu correo quedó confirmado. Para publicar tu página gratis (sin comisiones ni costo de inscripción) falta:",
      { lista: ["Completar tus datos: documento, dirección de notificaciones y WhatsApp.", "Subir tu documento. Es privado: solo lo ve el equipo de verificación.", "Aceptar los términos y la política de tratamiento de datos."] },
      "Cuando envíes todo, el equipo lo revisa y te avisamos por correo.",
    ],
    boton: { texto: "Continuar mi registro", url: `${sitio}/proveedores/registro` },
  });
}

/* ───────────── Correo: revisión del proveedor ───────────── */

/** Proveedor: envió su registro y quedó en revisión. */
export function registroRecibido(d: { nombre?: string | null }): Mensaje {
  return armar({ asunto: "Recibimos tu registro en LasTresB", nombre: d.nombre, titulo: "Recibimos tu registro", cuerpo: ["Tu registro como proveedor quedó en revisión.", "El equipo revisa tu documento y tu WhatsApp. Te avisaremos por correo apenas esté listo; mientras tanto no necesitas hacer nada más."] });
}

/** Proveedor: el equipo lo aprobó y su página ya está publicada. */
export function proveedorAprobado(d: { nombre?: string | null; nombrePublico: string; slug: string; sinFotos?: boolean }): Mensaje {
  return armar({
    asunto: "Tu página en LasTresB ya está publicada",
    nombre: d.nombre,
    titulo: "Tu página ya está publicada",
    cuerpo: [
      `Aprobamos tu registro: ${d.nombrePublico} ya aparece en LasTresB con la insignia «Verificado».`,
      `Tu página: ${sitio}/${d.slug}`,
      ...(d.sinFotos ? ["Ya tenemos tus datos y ya eres visible para nuestros clientes, pero no te podrán contactar hasta que subas la foto de tu documento y tu selfie."] : []),
      "Para recibir más clientes:",
      { lista: ["Completa tu portafolio: fotos, servicios con «precio desde» y zonas de atención.", "Descarga tu código QR para volantes y tarjetas desde tu panel.", "Comparte tu enlace por WhatsApp y redes."] },
    ],
    boton: { texto: "Ir a mi panel", url: `${sitio}/panel` },
  });
}

/** Proveedor: el equipo no pudo aprobarlo; se le dice el motivo y cómo corregirlo. */
export function proveedorRechazado(d: { nombre?: string | null; motivo: string }): Mensaje {
  return armar({
    asunto: "Necesitamos que corrijas tu registro en LasTresB",
    nombre: d.nombre,
    titulo: "Falta corregir tu registro",
    cuerpo: ["Revisamos tu registro y por ahora no pudimos aprobarlo.", `Motivo: ${d.motivo}`, "Entra a tu panel, corrige lo indicado y vuelve a enviarlo para revisión."],
    boton: { texto: "Corregir mi registro", url: `${sitio}/panel` },
    pie: "Si tienes dudas, respóndenos este correo.",
  });
}

/* ───────────── WhatsApp (el equipo lo abre y lo envía desde su WhatsApp) ───────────── */

/** Invitación a un proveedor registrado por el equipo. */
export function whatsappInvitacion(d: { nombre: string; url: string; horas: number }): string {
  return `Hola, ${d.nombre}. Te registramos en LasTresB. Entra a este enlace para crear tu clave, revisar tus datos y aceptar los términos (vence en ${d.horas} horas): ${d.url}`;
}

/** Aviso de aprobación para proveedores sin correo (alta asistida). */
export function whatsappProveedorAprobado(d: { nombre: string; nombrePublico: string; slug: string; sinFotos?: boolean }): string {
  return `Hola, ${d.nombre}. Aprobamos tu registro: ${d.nombrePublico} ya está publicado en LasTresB. Tu página: ${sitio}/${d.slug}` + (d.sinFotos ? " Solo falta que subas la foto de tu documento y tu selfie desde tu panel: sin ellas los clientes no podrán contactarte." : "");
}

/** Aviso de rechazo para proveedores sin correo (alta asistida). */
export function whatsappProveedorRechazado(d: { nombre: string; motivo: string }): string {
  return `Hola, ${d.nombre}. Revisamos tu registro en LasTresB y falta corregir algo: ${d.motivo}. Escríbenos por aquí y te ayudamos a completarlo.`;
}

/* ───────────── WhatsApp: seguimiento de solicitudes sin proveedor (B7) ───────────── */

/** El equipo le pide a un proveedor cercano que contacte al cliente (el cliente autorizó que se compartan sus datos). */
export function whatsappPedirAProveedor(d: { proveedor: string; cliente: string; servicio: string; lugar: string | null; whatsappCliente: string }): string {
  return `Hola ${d.proveedor}, te escribimos de LasTresB. ${d.cliente} busca ${d.servicio}${d.lugar ? ` para ${d.lugar}` : ""} y aún no tiene quién lo atienda. Su WhatsApp es +${d.whatsappCliente.replace(/\D/g, "")}. ¿Puedes escribirle y cotizarle? Gracias.`;
}

/** El equipo le cuenta al cliente que ya se le pidió a un proveedor que lo contacte. */
export function whatsappAvisarCliente(d: { cliente: string; servicio: string; proveedor: string }): string {
  return `Hola ${d.cliente}, te escribimos de LasTresB por tu solicitud de ${d.servicio}. Ya le pedimos a ${d.proveedor} que te escriba por WhatsApp. Si hoy no lo hace, respóndenos por aquí y buscamos otra opción.`;
}

/** El equipo le cuenta al cliente que todavía no hay proveedor para su solicitud. */
export function whatsappSinProveedor(d: { cliente: string; servicio: string }): string {
  return `Hola ${d.cliente}, te escribimos de LasTresB por tu solicitud de ${d.servicio}. Por ahora no tenemos un proveedor disponible para ti. Seguimos buscando y te escribimos apenas haya uno.`;
}
