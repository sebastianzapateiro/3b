-- P2 · Búsqueda: extensiones de texto en español y regla de auditoría.
-- Habilita unaccent (ignorar tildes) y pg_trgm (coincidencia difusa/ILIKE con %).
-- statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "unaccent";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
-- CU-78 / regla 3: auditoría solo admite inserciones. Nunca UPDATE ni DELETE.
-- statement-breakpoint
REVOKE UPDATE, DELETE ON TABLE "public"."auditoria" FROM PUBLIC;
