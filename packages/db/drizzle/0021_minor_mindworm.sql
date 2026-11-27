CREATE TABLE "correos_enviados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"para" text NOT NULL,
	"asunto" text NOT NULL,
	"estado" text NOT NULL,
	"error" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "correos_enviados_creado_idx" ON "correos_enviados" USING btree ("creado_en");