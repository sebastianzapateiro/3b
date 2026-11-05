CREATE TYPE "public"."estado_ayuda_inscripcion" AS ENUM('nueva', 'contactada');--> statement-breakpoint
CREATE TABLE "solicitudes_ayuda_inscripcion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"oficio" text NOT NULL,
	"celular" text NOT NULL,
	"estado" "estado_ayuda_inscripcion" DEFAULT 'nueva' NOT NULL,
	"origen" text NOT NULL,
	"pagina" text,
	"revisar" boolean DEFAULT false NOT NULL,
	"autoriza_datos" boolean DEFAULT false NOT NULL,
	"consentimiento_version" text,
	"ip" text,
	"user_agent" text,
	"contactada_por" text,
	"contactada_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solicitudes_ayuda_inscripcion" ADD CONSTRAINT "solicitudes_ayuda_inscripcion_contactada_por_user_id_fk" FOREIGN KEY ("contactada_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;