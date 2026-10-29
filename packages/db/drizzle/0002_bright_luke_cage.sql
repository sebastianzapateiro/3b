CREATE TYPE "public"."estado_solicitud_servicio" AS ENUM('nueva', 'avisada');--> statement-breakpoint
ALTER TYPE "public"."tipo_politica" ADD VALUE 'declaracion_servicios_no_permitidos';--> statement-breakpoint
CREATE TABLE "solicitudes_servicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"oficio_slug" text,
	"texto_libre" text,
	"localidad_id" integer,
	"whatsapp" text,
	"autoriza_datos" boolean DEFAULT false NOT NULL,
	"estado" "estado_solicitud_servicio" DEFAULT 'nueva' NOT NULL,
	"cuenta_como_demanda" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "popular" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "atiende_urgencias" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categorias" ADD COLUMN "subgrupo" text;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "atiende_urgencias" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "disponible_24h" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_localidad_id_localidades_id_fk" FOREIGN KEY ("localidad_id") REFERENCES "public"."localidades"("id") ON DELETE no action ON UPDATE no action;