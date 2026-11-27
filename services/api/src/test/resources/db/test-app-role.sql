-- Igual ao infra/compose/postgres/init/01-databases.sh: banco próprio da API, de um usuário sem superusuário.
CREATE ROLE bruzfin LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'bruzfin-test';
CREATE DATABASE bruzfin OWNER bruzfin;
REVOKE ALL ON DATABASE bruzfin FROM PUBLIC;
