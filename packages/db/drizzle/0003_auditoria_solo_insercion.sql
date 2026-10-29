-- B8 / regla 3: `auditoria` solo admite inserciones. Un disparador rechaza cualquier UPDATE, DELETE o TRUNCATE,
-- incluso para el rol dueño de la tabla (REVOKE no alcanza al dueño).
CREATE OR REPLACE FUNCTION "auditoria_solo_insercion"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La tabla auditoria es de solo inserción: no se permite % ', TG_OP;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS "auditoria_sin_cambios" ON "auditoria";--> statement-breakpoint
CREATE TRIGGER "auditoria_sin_cambios" BEFORE UPDATE OR DELETE ON "auditoria" FOR EACH ROW EXECUTE FUNCTION "auditoria_solo_insercion"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "auditoria_sin_vaciado" ON "auditoria";--> statement-breakpoint
CREATE TRIGGER "auditoria_sin_vaciado" BEFORE TRUNCATE ON "auditoria" FOR EACH STATEMENT EXECUTE FUNCTION "auditoria_solo_insercion"();
