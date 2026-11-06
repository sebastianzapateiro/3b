-- Estandariza los WhatsApp y celulares ya guardados al formato «+57XXXXXXXXXX» (todos son de Colombia).
--   10 dígitos            → +57 + los 10 dígitos
--   57 + 10 dígitos       → + + los 12 dígitos
--   cualquier otro caso   → se deja tal cual (no se inventa un número)
-- Es idempotente: se puede correr más de una vez. Los números nuevos ya se guardan así (normalizarWhatsapp en packages/shared).

UPDATE "proveedores"
SET "whatsapp" = CASE
  WHEN regexp_replace("whatsapp", '\D', '', 'g') ~ '^[0-9]{10}$' THEN '+57' || regexp_replace("whatsapp", '\D', '', 'g')
  WHEN regexp_replace("whatsapp", '\D', '', 'g') ~ '^57[0-9]{10}$' THEN '+' || regexp_replace("whatsapp", '\D', '', 'g')
  ELSE "whatsapp" END
WHERE "whatsapp" <> '' AND "whatsapp" !~ '^\+57[0-9]{10}$';
--> statement-breakpoint

UPDATE "user"
SET "telefono" = CASE
  WHEN regexp_replace("telefono", '\D', '', 'g') ~ '^[0-9]{10}$' THEN '+57' || regexp_replace("telefono", '\D', '', 'g')
  WHEN regexp_replace("telefono", '\D', '', 'g') ~ '^57[0-9]{10}$' THEN '+' || regexp_replace("telefono", '\D', '', 'g')
  ELSE "telefono" END
WHERE "telefono" IS NOT NULL AND "telefono" <> '' AND "telefono" !~ '^\+57[0-9]{10}$';
--> statement-breakpoint

UPDATE "solicitudes_servicio"
SET "whatsapp" = CASE
  WHEN regexp_replace("whatsapp", '\D', '', 'g') ~ '^[0-9]{10}$' THEN '+57' || regexp_replace("whatsapp", '\D', '', 'g')
  WHEN regexp_replace("whatsapp", '\D', '', 'g') ~ '^57[0-9]{10}$' THEN '+' || regexp_replace("whatsapp", '\D', '', 'g')
  ELSE "whatsapp" END
WHERE "whatsapp" IS NOT NULL AND "whatsapp" <> '' AND "whatsapp" !~ '^\+57[0-9]{10}$';
--> statement-breakpoint

UPDATE "solicitudes_ayuda_inscripcion"
SET "celular" = CASE
  WHEN regexp_replace("celular", '\D', '', 'g') ~ '^[0-9]{10}$' THEN '+57' || regexp_replace("celular", '\D', '', 'g')
  WHEN regexp_replace("celular", '\D', '', 'g') ~ '^57[0-9]{10}$' THEN '+' || regexp_replace("celular", '\D', '', 'g')
  ELSE "celular" END
WHERE "celular" <> '' AND "celular" !~ '^\+57[0-9]{10}$';
