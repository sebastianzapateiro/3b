CREATE TABLE "mensajes_contacto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"correo" text NOT NULL,
	"motivo" text NOT NULL,
	"mensaje" text NOT NULL,
	"autoriza_datos" boolean DEFAULT false NOT NULL,
	"estado" text DEFAULT 'nuevo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
