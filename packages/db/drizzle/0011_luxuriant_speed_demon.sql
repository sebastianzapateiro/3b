ALTER TYPE "public"."estado_solicitud_servicio" ADD VALUE 'en_gestion';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_servicio" ADD VALUE 'proveedor_contactado';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_servicio" ADD VALUE 'atendida';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_servicio" ADD VALUE 'sin_proveedor';--> statement-breakpoint
ALTER TYPE "public"."estado_solicitud_servicio" ADD VALUE 'descartada';--> statement-breakpoint
CREATE TABLE "solicitud_seguimiento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solicitud_id" uuid NOT NULL,
	"autor_id" text NOT NULL,
	"tipo" text NOT NULL,
	"canal" text,
	"proveedor_id" uuid,
	"estado_nuevo" text,
	"nota" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "responsable_id" text;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "proxima_accion_en" date;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD COLUMN "actualizada_en" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "solicitud_seguimiento" ADD CONSTRAINT "solicitud_seguimiento_solicitud_id_solicitudes_servicio_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_seguimiento" ADD CONSTRAINT "solicitud_seguimiento_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_seguimiento" ADD CONSTRAINT "solicitud_seguimiento_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_responsable_id_user_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;