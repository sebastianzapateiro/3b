/**
 * B1 · Catálogo de correos del sistema: cuál es, a quién le llega, cuándo sale y cómo se ve. Para el equipo (/admin/correos).
 * Lógica pura: cada vista se arma con datos de ejemplo y las mismas plantillas que usa el envío real (lib/plantillas.ts).
 * Al crear una plantilla nueva, agrégala aquí; `correos-catalogo.test.ts` comprueba que cada entrada se arma bien.
 */
import { armarCorreo } from "./actividad-correo";
import type { EventoCola } from "./actividad-cola";
import * as p from "./plantillas";

export type Destinatario = "Proveedor" | "Cliente" | "Cualquier usuario" | "Reclamante" | "Equipo";

export type EntradaCorreo = {
  id: string;
  grupo: "Cuenta" | "Proveedor" | "Cliente" | "Reclamos y datos" | "Equipo";
  destinatario: Destinatario;
  /** Qué hace que salga. */
  cuando: string;
  /** Archivo donde se envía (referencia para quien mantiene el código). */
  codigo: string;
  /** Aviso que el equipo debe conocer (p. ej. cuándo NO sale). */
  nota?: string;
  /** Reconoce el asunto real en el historial. */
  coincide: RegExp;
  /** Cómo se ve, con datos de ejemplo. `html` vacío = correo de solo texto. */
  vista: () => { asunto: string; texto: string; html: string };
};

const soloTexto = (m: p.MensajeTexto) => ({ ...m, html: "" });
const AHORA = new Date("2026-01-15T15:00:00-05:00");
const evento = (tipo: EventoCola["tipo"], campos: string[]): EventoCola => ({ id: "e", proveedorId: "p", tipo, campos, detalle: null, creadoEn: AHORA, intentos: 0, proximoIntento: AHORA });
const datosAviso = { proveedorId: "00000000-0000-0000-0000-000000000000", nombre: "Oscar | Arte y Diseño", whatsapp: "+573001234567", oficios: ["Pintura"], zonas: ["Chapinero", "Usaquén"], porcentaje: 60, faltan: ["Identidad", "Documentos"], origen: {}, urlAdmin: "https://www.lastresb.com.co/admin/proveedores/ejemplo" };

export const CATALOGO_CORREOS: EntradaCorreo[] = [
  { id: "confirmar-correo", grupo: "Cuenta", destinatario: "Cualquier usuario", cuando: "Se registra con correo y clave: debe confirmar su correo.", codigo: "lib/auth.ts", coincide: /^Confirma tu correo/, vista: () => p.confirmarCorreo({ nombre: "Camila", url: "https://www.lastresb.com.co/verificar?token=…" }) },
  { id: "bienvenida-proveedor", grupo: "Cuenta", destinatario: "Proveedor", cuando: "Confirma su correo y tiene perfil de proveedor.", codigo: "lib/auth.ts", coincide: /^Bienvenido a LasTresB: completa/, vista: () => p.bienvenidaProveedor({ nombre: "Jorge" }) },
  { id: "bienvenida-cliente", grupo: "Cuenta", destinatario: "Cliente", cuando: "Confirma su correo y no tiene perfil de proveedor.", codigo: "lib/auth.ts", coincide: /^Bienvenido a LasTresB$/, vista: () => p.bienvenidaCliente({ nombre: "Camila" }) },
  { id: "recuperar-clave", grupo: "Cuenta", destinatario: "Cualquier usuario", cuando: "Pide «olvidé mi clave». El enlace vence en 1 hora.", codigo: "lib/auth.ts", coincide: /^Cambia tu clave/, vista: () => p.recuperarClave({ nombre: "Camila", url: "https://www.lastresb.com.co/nueva-clave?token=…" }) },
  { id: "invitacion", grupo: "Cuenta", destinatario: "Cualquier usuario", cuando: "El equipo le crea la cuenta (alta asistida o usuario de backoffice): enlace para elegir su clave.", codigo: "lib/invitaciones.ts", nota: "Si el proveedor no tiene correo real, no sale: el equipo lo invita por WhatsApp.", coincide: /^Te crearon una cuenta/, vista: () => p.invitacionCuenta({ nombre: "Oscar", motivo: "El equipo de LasTresB creó tu página como proveedor.", url: "https://www.lastresb.com.co/nueva-clave?token=…", horas: 72 }) },
  { id: "clave-cambiada", grupo: "Cuenta", destinatario: "Cualquier usuario", cuando: "Un admin le cambia la clave (se cierran sus sesiones).", codigo: "lib/claves.ts", coincide: /^Cambiaron tu clave/, vista: () => p.claveCambiadaPorEquipo({ nombre: "Camila" }) },

  { id: "registro-recibido", grupo: "Proveedor", destinatario: "Proveedor", cuando: "Envía su perfil a revisión.", codigo: "lib/avisos-proveedor.ts", nota: "No sale si el proveedor tiene un correo ficticio (creado por el equipo sin correo).", coincide: /^Recibimos tu registro/, vista: () => p.registroRecibido({ nombre: "Jorge" }) },
  { id: "aprobado", grupo: "Proveedor", destinatario: "Proveedor", cuando: "El equipo lo aprueba y su página queda publicada.", codigo: "lib/avisos-proveedor.ts", nota: "No sale con correo ficticio: el equipo avisa por WhatsApp.", coincide: /^Tu página en LasTresB ya está publicada/, vista: () => p.proveedorAprobado({ nombre: "Jorge", nombrePublico: "Jorge Plomería", slug: "jorge-plomeria" }) },
  { id: "rechazado", grupo: "Proveedor", destinatario: "Proveedor", cuando: "El equipo no lo aprueba: lleva el motivo.", codigo: "lib/avisos-proveedor.ts", nota: "No sale con correo ficticio.", coincide: /^Necesitamos que corrijas/, vista: () => p.proveedorRechazado({ nombre: "Jorge", motivo: "El documento no se alcanza a leer" }) },
  { id: "perfil-editado", grupo: "Proveedor", destinatario: "Proveedor", cuando: "Un admin edita sus datos y deja marcada la casilla «avisar». Dice qué cambió, nunca los valores.", codigo: "lib/avisos-proveedor.ts", nota: "No sale con correo ficticio.", coincide: /^El equipo de LasTresB actualizó tu perfil/, vista: () => p.perfilEditadoPorEquipo({ nombre: "Jorge", cambios: ["Presentación", "Localidades"] }) },

  { id: "calificar", grupo: "Cliente", destinatario: "Cliente", cuando: "El proveedor marca «Servicio prestado»: enlace para calificarlo.", codigo: "lib/servicios-prestados.ts", nota: "Solo si el cliente tiene correo real; si no, queda en /admin/solicitudes para enviarlo por WhatsApp.", coincide: /^¿Cómo te fue con /, vista: () => soloTexto(p.calificacionServicio({ cliente: "Camila", proveedor: "Jorge Plomería", enlace: "https://www.lastresb.com.co/jorge-plomeria/calificar?codigo=ABC234" })) },

  { id: "reclamo-recibido", grupo: "Reclamos y datos", destinatario: "Reclamante", cuando: "Envía un reclamo en /reclamos: acuse con radicado y fecha límite.", codigo: "app/reclamos/actions.ts", coincide: /^Recibimos tu reclamo /, vista: () => soloTexto(p.reclamoRecibido({ nombre: "Camila", proveedor: "Jorge Plomería", radicado: "A1B2C3D4", fechaLimite: "2026-02-05" })) },
  { id: "reclamo-datos", grupo: "Reclamos y datos", destinatario: "Reclamante", cuando: "El equipo le entrega los datos del proveedor (art. 53, Ley 1480).", codigo: "admin/(panel)/cumplimiento/actions.ts", nota: "Lleva el documento del proveedor descifrado: por eso no se guarda el contenido en el historial.", coincide: /^Datos del proveedor sobre tu reclamo/, vista: () => soloTexto(p.reclamoDatosProveedor({ reclamante: "Camila", nombreLegal: "Jorge Pérez", nombrePublico: "Jorge Plomería", documento: "CC 1.000.000.000", direccion: "Calle 1 # 2-3", whatsapp: "+573001234567" })) },
  { id: "reclamo-respondido", grupo: "Reclamos y datos", destinatario: "Reclamante", cuando: "El equipo responde y cierra el reclamo.", codigo: "admin/(panel)/cumplimiento/actions.ts", coincide: /^Respuesta a tu reclamo/, vista: () => soloTexto(p.reclamoRespondido({ reclamante: "Camila", respuesta: "Hablamos con el proveedor y acordó repetir el trabajo sin costo." })) },
  { id: "datos-respondida", grupo: "Reclamos y datos", destinatario: "Cualquier usuario", cuando: "El equipo responde a su solicitud sobre sus datos personales (Ley 1581).", codigo: "admin/(panel)/cumplimiento/actions.ts", coincide: /^Respuesta a tu solicitud sobre tus datos/, vista: () => soloTexto(p.solicitudDatosRespondida({ nombre: "Camila", respuesta: "Ya eliminamos tu cuenta, salvo el historial que la ley nos obliga a conservar." })) },

  { id: "nuevo-registro", grupo: "Equipo", destinatario: "Equipo", cuando: "Alguien crea una cuenta por su cuenta (correo o Google). Llega a zapateirosebastian@gmail.com y al correo de Andrés, o a los de `correos_aviso_registro` en `configuracion`.", codigo: "lib/avisos-equipo.ts", nota: "No sale cuando la cuenta la crea el equipo (alta asistida): ahí el aviso es el de actividad.", coincide: /^Nuevo registro de /, vista: () => p.nuevoRegistroEquipo({ nombre: "Jorge Pérez", correo: "jorge@correo.com", telefono: "+573001234567", tipo: "proveedor", metodo: "correo y clave", oficios: ["Plomería"] }) },
  { id: "actividad", grupo: "Equipo", destinatario: "Equipo", cuando: "Un proveedor se crea o cambia (datos, archivos, estado). Se agrupa: los cambios salen en un solo correo a los 5 minutos; la creación sale de inmediato. Va a `ADMIN_NOTIFY_EMAIL` (contactolastresb@, que reenvía a los socios).", codigo: "lib/actividad.ts", nota: "Depende del cron que llama a /api/cron/avisos cada minuto. Vista previa de una creación.", coincide: /^LasTresB · (Proveedor nuevo|Cambios en)/, vista: () => armarCorreo(datosAviso, [evento("creado", ["registro"])], AHORA) },
];

/** Nombre legible del correo según su asunto real (para el historial); null si no es uno del catálogo. */
export function entradaPorAsunto(asunto: string): EntradaCorreo | null {
  return CATALOGO_CORREOS.find((c) => c.coincide.test(asunto)) ?? null;
}
