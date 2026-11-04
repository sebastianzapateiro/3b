-- Borrar una fila de "user" revisa la llave foránea auditoria.actor_id con «SELECT … FOR KEY SHARE», y ese bloqueo
-- exige permiso de UPDATE sobre auditoria. 0010 se lo quitó también al dueño, así que ningún usuario se podía borrar
-- («permission denied for table auditoria»), ni siquiera los que no tienen filas en auditoria.
-- Se devuelve UPDATE solo sobre la columna id: basta para la revisión de llaves y el disparador
-- "auditoria_sin_cambios" (0003) sigue rechazando cualquier UPDATE o DELETE. La regla «solo inserción» se mantiene.
GRANT UPDATE ("id") ON TABLE "public"."auditoria" TO CURRENT_USER;
