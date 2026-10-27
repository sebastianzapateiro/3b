# Requerimientos

Prioridad: **M** imprescindible · **S** deseable · **C** posterior. Detalle completo en Drive (01_Requerimientos).

## Funcionales del MVP

| Área | IDs | Resumen |
|---|---|---|
| Búsqueda | RF-01–06 | Texto + localidad (M), categorías (M), tarjetas con foto, calificación, zonas, insignias y WhatsApp (M), filtros y orden (S), sin registro (M) |
| Perfil | RF-07–10 | Perfil público (M), edición por el proveedor (M), pausar (S), datos privados nunca públicos (M) |
| Contacto | RF-11–13 | WhatsApp con mensaje prellenado (M), registrar cada clic (M), invitar a registrarse sin bloquear (S) |
| Registro | RF-14–20 | Comprador con Google o correo + mayoría de edad (M); proveedor con documento, dirección de notificaciones, WhatsApp (M); OTP y verificación de correo (M); documento privado (M); RUT/matrícula (S, ver reglas); consentimiento con versión, fecha e IP (M); recuperar clave (M) |
| Reseñas | RF-21–26 | Solo con contacto previo (M); 4 criterios: puntualidad, calidad, calidad/precio, cumplimiento (M); recordatorio (S); réplica del proveedor (M); reportar (M) |
| Backoffice | RF-27–33 | Aprobación con documentos, insignias, moderación, taxonomía, suspensión, solicitudes de datos y reclamos (M); tablero (S) |
| Legal | RF-34–36 | Políticas versionadas (M), formulario de reclamos art. 53 (M), exportar/eliminar cuenta (M) |

## Portafolio del proveedor (RF-37–51)

- Página pública en `/<slug>`, renderizada en servidor e indexable, con vista previa Open Graph (M).
- Secciones: presentación, servicios con "precio desde" y unidad, galería, reseñas por criterio, zonas, horario, insignias y WhatsApp (M).
- Slug: minúsculas, números y guiones; único; palabras reservadas (`packages/shared/src/slug.ts`); el anterior redirige 301 (M); un cambio cada 30 días (S).
- Pausado → "no disponible temporalmente"; suspendido o rechazado → no se muestra (M).
- QR descargable, redes, plantillas y color de acento (S). Estadísticas de visitas y clics (S).

## No funcionales

PWA mobile-first (RNF-01) · resultados en menos de 3 s en 4G (RNF-02) · SEO de perfiles y "categoría + localidad" (RNF-03) · documentos cifrados con URL firmada (RNF-04) · auditoría de accesos y moderación (RNF-05) · 99 % mensual y respaldo diario (RNF-06) · accesibilidad (RNF-07) · español de Colombia (RNF-08) · límites y captcha (RNF-09) · costos bajos (RNF-10).
