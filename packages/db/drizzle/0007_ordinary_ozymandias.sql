CREATE TYPE "public"."fuente_origen" AS ENUM('google_maps', 'instagram', 'ferreteria', 'referido', 'otro');--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "fuente_origen" "fuente_origen";--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "primer_contacto" date;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "ultimo_contacto" date;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "proxima_accion" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "notas_internas" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "completitud" integer DEFAULT 0 NOT NULL;