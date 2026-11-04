CREATE TABLE "avisos_proveedor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"campos" text[] DEFAULT '{}' NOT NULL,
	"detalle" text,
	"clave" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"enviado_en" timestamp with time zone,
	"intentos" integer DEFAULT 0 NOT NULL,
	"proximo_intento" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text,
	"visto_en" timestamp with time zone,
	CONSTRAINT "avisos_proveedor_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "utm_content" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "utm_term" text;--> statement-breakpoint
ALTER TABLE "avisos_proveedor" ADD CONSTRAINT "avisos_proveedor_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "avisos_proveedor_pendientes_idx" ON "avisos_proveedor" USING btree ("enviado_en","proximo_intento");--> statement-breakpoint
CREATE INDEX "avisos_proveedor_prov_idx" ON "avisos_proveedor" USING btree ("proveedor_id","creado_en");