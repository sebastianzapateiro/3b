/**
 * CU-79 · Parámetros configurables (regla 8: plazos, límites y días no van como constantes).
 * Se guardan en `configuracion`; estos son sus valores por defecto y cómo se muestran en B8.
 */
export type Parametro = { clave: string; etiqueta: string; grupo: string; defecto: number | null };

export const PARAMETROS: Parametro[] = [
  { clave: "otp_vigencia_min", etiqueta: "Vigencia del OTP (min)", grupo: "Verificación", defecto: 5 },
  { clave: "otp_intentos", etiqueta: "Intentos de OTP antes del bloqueo", grupo: "Verificación", defecto: 3 },
  { clave: "plazo_rut_dias", etiqueta: "Plazo para cargar RUT (días)", grupo: "Verificación", defecto: 30 },
  { clave: "documento_max_mb", etiqueta: "Tamaño máximo de documentos (MB, tope del bucket: 10)", grupo: "Verificación", defecto: 10 },
  { clave: "url_firmada_min", etiqueta: "Vigencia del enlace para abrir un documento (min)", grupo: "Verificación", defecto: 5 },
  { clave: "invitacion_vigencia_h", etiqueta: "Vigencia de la invitación a una cuenta nueva (h)", grupo: "Verificación", defecto: 72 },
  { clave: "apto_menores_meses", etiqueta: "Revalidar «Apto para menores» (meses)", grupo: "Verificación", defecto: 6 },
  { clave: "recordatorio_calificar_dias", etiqueta: "Recordatorio para calificar (días)", grupo: "Reseñas y moderación", defecto: null },
  { clave: "reportes_para_ocultar", etiqueta: "Reportes para ocultar provisionalmente", grupo: "Reseñas y moderación", defecto: 3 },
  { clave: "meta_atencion_reportes_h", etiqueta: "Meta de atención de reportes (h)", grupo: "Reseñas y moderación", defecto: 48 },
  { clave: "ventana_reputacion_dias", etiqueta: "Ventana de reputación (días)", grupo: "Reseñas y moderación", defecto: 90 },
  { clave: "plazo_consulta_dias_habiles", etiqueta: "Consultas de datos", grupo: "Plazos legales (días hábiles)", defecto: 10 },
  { clave: "plazo_reclamo_dias_habiles", etiqueta: "Reclamos de datos", grupo: "Plazos legales (días hábiles)", defecto: 15 },
  { clave: "plazo_reclamo_consumo_dias_habiles", etiqueta: "Reclamos de consumo", grupo: "Plazos legales (días hábiles)", defecto: 15 },
  { clave: "min_proveedores_seo", etiqueta: "Mínimo de proveedores para publicar páginas SEO", grupo: "SEO", defecto: 3 },
];

export const defectoDe = (clave: string) => PARAMETROS.find((p) => p.clave === clave)?.defecto ?? null;
