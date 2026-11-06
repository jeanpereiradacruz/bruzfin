-- Usuários da API (KAN-28). Login e senha ficam no Keycloak; aqui só o vínculo pelo `sub` e o perfil.
CREATE TABLE app_user
(
    id           UUID                     NOT NULL,
    keycloak_sub VARCHAR(255)             NOT NULL,
    email        VARCHAR(320)             NOT NULL,
    name         VARCHAR(200),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT app_user_pk PRIMARY KEY (id),
    CONSTRAINT app_user_keycloak_sub_uk UNIQUE (keycloak_sub)
);
