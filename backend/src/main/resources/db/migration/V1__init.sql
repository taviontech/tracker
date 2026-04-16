CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password_hash               VARCHAR(255),
    first_name                  VARCHAR(100),
    last_name                   VARCHAR(100),
    phone                       VARCHAR(50),
    avatar_url                  TEXT,
    system_role                 VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified              BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token    VARCHAR(255),
    email_verification_sent_at  TIMESTAMPTZ,
    password_reset_token        VARCHAR(255),
    password_reset_sent_at      TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE companies (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    logo_url      VARCHAR(500),
    website       VARCHAR(255),
    ticket_prefix VARCHAR(10) NOT NULL DEFAULT 'TKT',
    statuses      TEXT DEFAULT '["TODO","IN_PROGRESS","IN_REVIEW","DONE"]',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE company_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,
    invited_by  UUID REFERENCES users(id),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user    ON company_users(user_id);

CREATE TABLE company_user_dev_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
    dev_role        VARCHAR(50) NOT NULL,
    CONSTRAINT uq_company_user_dev_role UNIQUE (company_user_id, dev_role)
);

CREATE INDEX idx_company_user_dev_roles_cu ON company_user_dev_roles(company_user_id);

CREATE TABLE invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_by  UUID NOT NULL REFERENCES users(id),
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_token   ON invitations(token);
CREATE INDEX idx_invitations_email   ON invitations(email);
CREATE INDEX idx_invitations_company ON invitations(company_id);

CREATE TABLE plans (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(100) NOT NULL,
    tier               VARCHAR(20) NOT NULL UNIQUE,
    max_managers       INT,
    max_modules        INT,
    max_groups         INT,
    max_newbies        INT,
    price_usd_monthly  NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (name, tier, max_managers, max_modules, max_groups, max_newbies, price_usd_monthly) VALUES
('Free', 'FREE', 3, 10, 3, 20, 0),
('Pro',  'PRO',  NULL, NULL, NULL, NULL, 29);

CREATE TABLE subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    plan_tier   VARCHAR(20) NOT NULL DEFAULT 'FREE',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);

CREATE TABLE sprints (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    goal        TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    start_date  DATE,
    end_date    DATE,
    columns     TEXT DEFAULT '["TODO","IN_PROGRESS","IN_REVIEW","DONE"]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sprints_company ON sprints(company_id);

CREATE TABLE tickets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sprint_id      UUID REFERENCES sprints(id) ON DELETE SET NULL,
    ticket_number  INT NOT NULL DEFAULT 0,
    title          VARCHAR(500) NOT NULL,
    description    TEXT,
    type           VARCHAR(30) NOT NULL DEFAULT 'TASK',
    priority       VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status         VARCHAR(30) NOT NULL DEFAULT 'TODO',
    points         INT,
    reporter_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    in_progress_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_company ON tickets(company_id);
CREATE INDEX idx_tickets_sprint  ON tickets(sprint_id);
CREATE INDEX idx_tickets_status  ON tickets(status);

CREATE TABLE ticket_tags (
    ticket_id UUID         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    tag       VARCHAR(100) NOT NULL,
    PRIMARY KEY (ticket_id, tag)
);

CREATE INDEX idx_ticket_tags_ticket ON ticket_tags(ticket_id);

CREATE TABLE ticket_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);

CREATE TABLE ticket_attachments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id    UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(500) NOT NULL,
    file_size    BIGINT,
    mime_type    VARCHAR(100),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);

CREATE TABLE ticket_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    field       VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id);
