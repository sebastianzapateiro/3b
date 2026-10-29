-- P3 · Huella HMAC del documento del proveedor (detectar duplicados sin descifrar). Ver src/cifrado.ts.
-- Idempotente: en la base compartida ya se aplicó como 0004_documento_huella antes de unir la rama de Andrés.
ALTER TABLE "proveedores" ADD COLUMN IF NOT EXISTS "documento_huella" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proveedores_documento_huella_idx" ON "proveedores" USING btree ("documento_huella");
