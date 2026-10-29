ALTER TABLE "proveedores" ADD COLUMN "documento_huella" text;--> statement-breakpoint
CREATE INDEX "proveedores_documento_huella_idx" ON "proveedores" USING btree ("documento_huella");