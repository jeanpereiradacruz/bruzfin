#!/bin/sh
# Cria um banco e um usuário próprio para a API e para o Keycloak.
# Roda só na primeira inicialização do volume (imagem oficial do PostgreSQL).
# Os usuários não são superusuários: a Row-Level Security vale para eles.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v bruzfin_password="$BRUZFIN_DB_PASSWORD" \
  -v keycloak_password="$KEYCLOAK_DB_PASSWORD" <<'SQL'
CREATE ROLE bruzfin LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'bruzfin_password';
CREATE DATABASE bruzfin OWNER bruzfin;
REVOKE ALL ON DATABASE bruzfin FROM PUBLIC;

CREATE ROLE keycloak LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'keycloak_password';
CREATE DATABASE keycloak OWNER keycloak;
REVOKE ALL ON DATABASE keycloak FROM PUBLIC;
SQL
