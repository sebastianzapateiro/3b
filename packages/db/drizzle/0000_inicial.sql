CREATE TYPE "public"."rol" AS ENUM('comprador', 'proveedor', 'verificador', 'moderador', 'admin');--> statement-breakpoint
CREATE TYPE "public"."estado_contenido" AS ENUM('visible', 'oculto', 'eliminado', 'en_revision');--> statement-breakpoint
CREATE TYPE "public"."estado_proveedor" AS ENUM('borrador', 'pendiente', 'aprobado', 'rechazado', 'en_revision', 'pausado', 'pausado_por_rut', 'suspendido');--> statement-breakpoint
CREATE TYPE "public"."segmento_proveedor" AS ENUM('independiente_sin_rut', 'independiente_con_rut', 'empresa');--> statement-breakpoint
CREATE TYPE "public"."tipo_archivo" AS ENUM('documento_frente', 'documento_reverso', 'rut', 'camara_comercio', 'matricula', 'autorizacion_ley_1918', 'portafolio');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('cc', 'ce', 'ppt', 'nit');--> statement-breakpoint
CREATE TYPE "public"."unidad_precio" AS ENUM('visita', 'hora', 'clase', 'metro2', 'trayecto', 'trabajo');--> statement-breakpoint
CREATE TYPE "public"."tipo_objeto_reporte" AS ENUM('resena', 'respuesta', 'foto', 'servicio', 'slug', 'perfil');--> statement-breakpoint
CREATE TYPE "public"."estado_tramite" AS ENUM('abierto', 'en_proceso', 'respondido', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."tipo_politica" AS ENUM('terminos_compradores', 'terminos_proveedores', 'tratamiento_datos', 'aviso_privacidad', 'cookies', 'resenas', 'autorizacion_ley_1918');--> statement-breakpoint
CREATE TYPE "public"."tipo_solicitud_datos" AS ENUM('consulta', 'rectificacion', 'supresion', 'exportacion');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"telefono" text,
	"declara_mayor_de_edad" boolean DEFAULT false NOT NULL,
	"eliminado_en" timestamp with time zone,
	"conservar_hasta" timestamp with time zone,
	"suspendido_hasta" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_roles" (
	"usuario_id" text NOT NULL,
	"rol" "rol" NOT NULL,
	"asignado_por" text,
	"asignado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_roles_usuario_id_rol_pk" PRIMARY KEY("usuario_id","rol")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barrios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"localidad_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"padre_id" integer,
	"nombre" text NOT NULL,
	"slug" text NOT NULL,
	"icono" text,
	"orden" integer DEFAULT 0 NOT NULL,
	"exige_insignia_menores" boolean DEFAULT false NOT NULL,
	"exige_rut_desde_alta" boolean DEFAULT false NOT NULL,
	"exige_matricula" boolean DEFAULT false NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "localidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer,
	"nombre" text NOT NULL,
	"slug" text NOT NULL,
	"es_bogota" boolean DEFAULT true NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "localidades_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "terminos_busqueda" (
	"id" serial PRIMARY KEY NOT NULL,
	"termino" text NOT NULL,
	"categoria_id" integer NOT NULL,
	"peso" real DEFAULT 1 NOT NULL,
	CONSTRAINT "terminos_busqueda_termino_categoriaId_unique" UNIQUE("termino","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "consultas_inhabilidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"verificador_id" text NOT NULL,
	"resultado_limpio" boolean NOT NULL,
	"soporte_ruta" text,
	"consultado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"tipo" "tipo_archivo" NOT NULL,
	"ruta_privada" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"eliminar_despues_de" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insignias" (
	"id" serial PRIMARY KEY NOT NULL,
	"clave" text NOT NULL,
	"nombre" text NOT NULL,
	"vigencia_meses" integer,
	CONSTRAINT "insignias_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "portafolio_fotos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"ruta" text NOT NULL,
	"ruta_miniatura" text,
	"descripcion" text,
	"declara_autoria" boolean NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"estado" "estado_contenido" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedor_categorias" (
	"proveedor_id" uuid NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "proveedor_categorias_proveedor_id_categoria_id_pk" PRIMARY KEY("proveedor_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "proveedor_insignias" (
	"proveedor_id" uuid NOT NULL,
	"insignia_id" integer NOT NULL,
	"otorgada_por" text,
	"otorgada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"vence" date,
	CONSTRAINT "proveedor_insignias_proveedor_id_insignia_id_pk" PRIMARY KEY("proveedor_id","insignia_id")
);
--> statement-breakpoint
CREATE TABLE "proveedor_localidades" (
	"proveedor_id" uuid NOT NULL,
	"localidad_id" integer NOT NULL,
	CONSTRAINT "proveedor_localidades_proveedor_id_localidad_id_pk" PRIMARY KEY("proveedor_id","localidad_id")
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"estado" "estado_proveedor" DEFAULT 'borrador' NOT NULL,
	"segmento" "segmento_proveedor",
	"nombre_publico" text NOT NULL,
	"slug" text NOT NULL,
	"presentacion" text,
	"anios_experiencia" integer,
	"whatsapp" text NOT NULL,
	"horario" jsonb,
	"pagina_web" text,
	"emite_factura" boolean DEFAULT false,
	"ofrece_garantia" boolean DEFAULT false,
	"formas_pago" text[],
	"tipo_documento" "tipo_documento",
	"documento_cifrado" text,
	"direccion_notificaciones" text,
	"fecha_nacimiento" date,
	"rut_fecha_limite" date,
	"motivo_rechazo" text,
	"promedio" real DEFAULT 0 NOT NULL,
	"total_resenas" integer DEFAULT 0 NOT NULL,
	"aprobado_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proveedores_usuarioId_unique" UNIQUE("usuario_id"),
	CONSTRAINT "proveedores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "servicios_proveedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"categoria_id" integer,
	"nombre" text NOT NULL,
	"descripcion" text,
	"precio_desde" numeric(12, 0),
	"unidad" "unidad_precio" DEFAULT 'visita' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slugs_historial" (
	"slug" text PRIMARY KEY NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"cambiado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acciones_moderacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_objeto" "tipo_objeto_reporte" NOT NULL,
	"objeto_id" text NOT NULL,
	"moderador_id" text NOT NULL,
	"accion" text NOT NULL,
	"motivo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"comprador_id" text,
	"anonimo_id" text,
	"categoria_id" integer,
	"localidad_id" integer,
	"origen" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo_objeto" "tipo_objeto_reporte" NOT NULL,
	"objeto_id" text NOT NULL,
	"reportante_id" text,
	"motivo" text NOT NULL,
	"detalle" text,
	"resuelto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resenas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contacto_id" uuid NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"comprador_id" text NOT NULL,
	"puntualidad" smallint NOT NULL,
	"calidad" smallint NOT NULL,
	"calidad_precio" smallint NOT NULL,
	"cumplimiento" smallint NOT NULL,
	"comentario" text,
	"verificada" boolean DEFAULT false NOT NULL,
	"estado" "estado_contenido" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resenas_contactoId_unique" UNIQUE("contacto_id")
);
--> statement-breakpoint
CREATE TABLE "respuestas_resena" (
	"resena_id" uuid PRIMARY KEY NOT NULL,
	"texto" text NOT NULL,
	"estado" "estado_contenido" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contacto_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"fecha_llegada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "servicios_contactoId_unique" UNIQUE("contacto_id"),
	CONSTRAINT "servicios_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"rol" text,
	"accion" text NOT NULL,
	"objeto_tipo" text,
	"objeto_id" text,
	"resultado" text,
	"motivo" text,
	"ip" text,
	"dispositivo" text,
	"metadatos" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracion" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" jsonb NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"politica_id" integer NOT NULL,
	"ip" text,
	"user_agent" text,
	"aceptado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "festivos" (
	"fecha" date PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "politicas" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "tipo_politica" NOT NULL,
	"version" text NOT NULL,
	"contenido_md" text NOT NULL,
	"esencial" boolean DEFAULT false NOT NULL,
	"vigente_desde" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reclamos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"reclamante_id" text,
	"nombre_reclamante" text NOT NULL,
	"correo_reclamante" text NOT NULL,
	"codigo_servicio" text,
	"descripcion" text NOT NULL,
	"solicita_datos_proveedor" boolean DEFAULT false NOT NULL,
	"datos_entregados_en" timestamp with time zone,
	"estado" "estado_tramite" DEFAULT 'abierto' NOT NULL,
	"fecha_limite" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes_datos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" text NOT NULL,
	"tipo" "tipo_solicitud_datos" NOT NULL,
	"detalle" text,
	"estado" "estado_tramite" DEFAULT 'abierto' NOT NULL,
	"fecha_limite" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_asignado_por_user_id_fk" FOREIGN KEY ("asignado_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barrios" ADD CONSTRAINT "barrios_localidad_id_localidades_id_fk" FOREIGN KEY ("localidad_id") REFERENCES "public"."localidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_padre_id_categorias_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminos_busqueda" ADD CONSTRAINT "terminos_busqueda_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultas_inhabilidades" ADD CONSTRAINT "consultas_inhabilidades_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultas_inhabilidades" ADD CONSTRAINT "consultas_inhabilidades_verificador_id_user_id_fk" FOREIGN KEY ("verificador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portafolio_fotos" ADD CONSTRAINT "portafolio_fotos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_categorias" ADD CONSTRAINT "proveedor_categorias_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_categorias" ADD CONSTRAINT "proveedor_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_insignias" ADD CONSTRAINT "proveedor_insignias_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_insignias" ADD CONSTRAINT "proveedor_insignias_insignia_id_insignias_id_fk" FOREIGN KEY ("insignia_id") REFERENCES "public"."insignias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_insignias" ADD CONSTRAINT "proveedor_insignias_otorgada_por_user_id_fk" FOREIGN KEY ("otorgada_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_localidades" ADD CONSTRAINT "proveedor_localidades_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_localidades" ADD CONSTRAINT "proveedor_localidades_localidad_id_localidades_id_fk" FOREIGN KEY ("localidad_id") REFERENCES "public"."localidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios_proveedor" ADD CONSTRAINT "servicios_proveedor_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios_proveedor" ADD CONSTRAINT "servicios_proveedor_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slugs_historial" ADD CONSTRAINT "slugs_historial_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acciones_moderacion" ADD CONSTRAINT "acciones_moderacion_moderador_id_user_id_fk" FOREIGN KEY ("moderador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_comprador_id_user_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_localidad_id_localidades_id_fk" FOREIGN KEY ("localidad_id") REFERENCES "public"."localidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_reportante_id_user_id_fk" FOREIGN KEY ("reportante_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_comprador_id_user_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_resena" ADD CONSTRAINT "respuestas_resena_resena_id_resenas_id_fk" FOREIGN KEY ("resena_id") REFERENCES "public"."resenas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_politica_id_politicas_id_fk" FOREIGN KEY ("politica_id") REFERENCES "public"."politicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_reclamante_id_user_id_fk" FOREIGN KEY ("reclamante_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_datos" ADD CONSTRAINT "solicitudes_datos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;