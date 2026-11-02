-- P2 · Búsqueda sin tildes con índices trigram, y regla 3 (CU-78) reforzada con permisos.
-- Portable: funciona en Supabase y en un Postgres propio (VPS). Las extensiones van al esquema `extensions`
-- (Supabase ya lo tiene; en otro servidor se crea) y los roles de Supabase solo se tocan si existen.
CREATE SCHEMA IF NOT EXISTS "extensions";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";--> statement-breakpoint
-- unaccent() es STABLE y no se puede indexar; con el diccionario explícito el resultado es fijo.
CREATE OR REPLACE FUNCTION "public"."f_unaccent"(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT "extensions"."unaccent"('"extensions"."unaccent"'::regdictionary, $1) $$;--> statement-breakpoint
-- Índices para `f_unaccent(lower(x)) LIKE '%término%'` (lib/busqueda.ts usa exactamente esta expresión).
CREATE INDEX IF NOT EXISTS "categorias_nombre_trgm" ON "categorias" USING gin ("public"."f_unaccent"(lower("nombre")) "extensions"."gin_trgm_ops");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "terminos_busqueda_termino_trgm" ON "terminos_busqueda" USING gin ("public"."f_unaccent"(lower("termino")) "extensions"."gin_trgm_ops");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proveedores_nombre_publico_trgm" ON "proveedores" USING gin ("public"."f_unaccent"(lower("nombre_publico")) "extensions"."gin_trgm_ops");--> statement-breakpoint
-- Regla 3: además del disparador de 0003, nadie tiene permiso de UPDATE, DELETE ni TRUNCATE sobre auditoria.
DO $$
DECLARE r text;
BEGIN
  EXECUTE 'REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "public"."auditoria" FROM PUBLIC, CURRENT_USER';
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "public"."auditoria" FROM %I', r);
    END IF;
  END LOOP;
END $$;
