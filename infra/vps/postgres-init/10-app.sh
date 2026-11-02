#!/bin/bash
# Crea el usuario de la app (sin superusuario) y su base. Corre solo la primera vez que se crea el volumen.
set -euo pipefail
psql -v ON_ERROR_STOP=1 -v clave="$DB_CLAVE_APP" --username "$POSTGRES_USER" --dbname postgres <<-SQL
  CREATE ROLE lastresb LOGIN PASSWORD :'clave';
  CREATE DATABASE lastresb OWNER lastresb ENCODING "UTF8" LC_COLLATE "C.UTF-8" LC_CTYPE "C.UTF-8" TEMPLATE template0;
  REVOKE ALL ON DATABASE lastresb FROM PUBLIC;
SQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname lastresb -c "ALTER SCHEMA public OWNER TO lastresb;"
