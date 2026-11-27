-- Lar, membros e convites (KAN-30), com a base da Row-Level Security.
--
-- Cada transação da API informa quem está agindo com SET LOCAL (set_config(..., true)):
--   app.user_id          usuário autenticado
--   app.household_id     lar do usuário
--   app.invite_code_hash hash do código de convite digitado (só no aceite)
-- Sem essas configurações nenhuma linha das tabelas do lar fica visível.
-- O usuário `bruzfin` é dono das tabelas; FORCE ROW LEVEL SECURITY faz as políticas valerem para ele também.
-- Migrações futuras que mexerem em dados destas tabelas precisam definir o contexto acima.

CREATE FUNCTION app_current_user() RETURNS UUID
    LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::UUID $$;

CREATE FUNCTION app_current_household() RETURNS UUID
    LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT NULLIF(current_setting('app.household_id', true), '')::UUID $$;

CREATE FUNCTION app_invite_code_hash() RETURNS TEXT
    LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT NULLIF(current_setting('app.invite_code_hash', true), '') $$;

CREATE TABLE household
(
    id         UUID                     NOT NULL,
    name       VARCHAR(60)              NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT household_pk PRIMARY KEY (id)
);

-- Um usuário pertence a um único lar por vez (household_member_user_uk).
CREATE TABLE household_member
(
    household_id UUID                     NOT NULL,
    user_id      UUID                     NOT NULL,
    role         VARCHAR(10)              NOT NULL,
    joined_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT household_member_pk PRIMARY KEY (household_id, user_id),
    CONSTRAINT household_member_user_uk UNIQUE (user_id),
    CONSTRAINT household_member_household_fk FOREIGN KEY (household_id) REFERENCES household (id) ON DELETE CASCADE,
    CONSTRAINT household_member_user_fk FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT household_member_role_ck CHECK (role IN ('OWNER', 'MEMBER'))
);

-- O código do convite nunca é gravado: só o SHA-256 dele.
CREATE TABLE household_invite
(
    id           UUID                     NOT NULL,
    household_id UUID                     NOT NULL,
    code_hash    VARCHAR(64)              NOT NULL,
    created_by   UUID                     NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    used_by      UUID,
    used_at      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT household_invite_pk PRIMARY KEY (id),
    CONSTRAINT household_invite_code_hash_uk UNIQUE (code_hash),
    CONSTRAINT household_invite_household_fk FOREIGN KEY (household_id) REFERENCES household (id) ON DELETE CASCADE,
    CONSTRAINT household_invite_created_by_fk FOREIGN KEY (created_by) REFERENCES app_user (id),
    CONSTRAINT household_invite_used_by_fk FOREIGN KEY (used_by) REFERENCES app_user (id),
    CONSTRAINT household_invite_used_ck CHECK ((used_by IS NULL) = (used_at IS NULL))
);

CREATE INDEX household_invite_household_idx ON household_invite (household_id);

-- Usuários criados antes deste ticket ganham o lar automático ("Lar de <primeiro nome>").
WITH new_household AS (
    SELECT u.id AS user_id,
           uuidv7() AS household_id,
           'Lar de ' || LEFT(COALESCE(NULLIF(split_part(btrim(u.name), ' ', 1), ''),
                                      split_part(u.email, '@', 1)), 53) AS name
    FROM app_user u
),
created AS (
    INSERT INTO household (id, name, created_at, updated_at)
    SELECT household_id, name, now(), now() FROM new_household
)
INSERT INTO household_member (household_id, user_id, role, joined_at)
SELECT household_id, user_id, 'OWNER', now() FROM new_household;

ALTER TABLE household ENABLE ROW LEVEL SECURITY;
ALTER TABLE household FORCE ROW LEVEL SECURITY;
CREATE POLICY household_isolation ON household
    USING (id = app_current_household())
    WITH CHECK (id = app_current_household());

-- O próprio vínculo é visível sem o lar no contexto: é assim que a API descobre o lar do usuário.
ALTER TABLE household_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_member FORCE ROW LEVEL SECURITY;
CREATE POLICY household_member_isolation ON household_member
    USING (household_id = app_current_household() OR user_id = app_current_user())
    WITH CHECK (household_id = app_current_household());

-- Quem digitou o código (app.invite_code_hash) enxerga só aquele convite, para poder aceitá-lo.
ALTER TABLE household_invite ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invite FORCE ROW LEVEL SECURITY;
CREATE POLICY household_invite_isolation ON household_invite
    USING (household_id = app_current_household() OR code_hash = app_invite_code_hash())
    WITH CHECK (household_id = app_current_household() OR code_hash = app_invite_code_hash());
