ALTER TABLE "solicitudes_servicio" ADD COLUMN "nombre" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "categoria_id" integer;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "direccion" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "lat" real;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "lng" real;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "origen_banner" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "resultados" integer;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "consentimiento_version" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "ip" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "contactos" ADD COLUMN "solicitud_id" uuid;--> statement-breakpoint
ALTER TABLE "contactos" ADD COLUMN "mensaje" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_solicitud_id_solicitudes_servicio_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes_servicio"("id") ON DELETE no action ON UPDATE no action;