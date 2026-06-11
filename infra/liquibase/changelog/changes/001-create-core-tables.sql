--liquibase formatted sql
--changeset token-tracker:002-create-core-tables

CREATE TABLE model_pricing (
    id                      SERIAL PRIMARY KEY,
    model_id                TEXT NOT NULL,
    provider_id             TEXT NOT NULL,
    input_token_price       NUMERIC(20,12) NOT NULL DEFAULT 0,
    output_token_price      NUMERIC(20,12) NOT NULL DEFAULT 0,
    cache_read_token_price  NUMERIC(20,12) NOT NULL DEFAULT 0,
    cache_write_token_price NUMERIC(20,12) NOT NULL DEFAULT 0,
    effective_from          TIMESTAMPTZ NOT NULL,
    effective_to            TIMESTAMPTZ,
    currency                TEXT NOT NULL DEFAULT 'USD'
);

CREATE TABLE token_usage (
    id               SERIAL PRIMARY KEY,
    timestamp        TIMESTAMPTZ NOT NULL,
    model_id         TEXT NOT NULL,
    provider_id      TEXT NOT NULL,
    project_dir      TEXT NOT NULL,
    input_tokens     INTEGER,
    output_tokens    INTEGER,
    reasoning_tokens INTEGER,
    total_tokens     INTEGER,
    cache_read       INTEGER,
    cache_write      INTEGER
);

CREATE INDEX idx_model_pricing_lookup ON model_pricing(model_id, provider_id, effective_from, effective_to);
CREATE INDEX idx_token_usage_timestamp ON token_usage(timestamp);
CREATE INDEX idx_token_usage_model    ON token_usage(model_id);
CREATE INDEX idx_token_usage_project  ON token_usage(project_dir);
--rollback DROP TABLE token_usage; DROP TABLE model_pricing;
