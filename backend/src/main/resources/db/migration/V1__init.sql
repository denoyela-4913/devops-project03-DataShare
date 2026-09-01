-- V1 — schéma initial (périmètre MVP obligatoire US01–US06).
-- Migrations additives : ce fichier ne sera jamais modifié. Les tags (US08) arriveront en V2.

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE stored_file (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    download_token VARCHAR(64)  NOT NULL UNIQUE,          -- non prédictible (SecureRandom)
    original_name  VARCHAR(255) NOT NULL,
    content_type   VARCHAR(127) NOT NULL,
    size_bytes     BIGINT       NOT NULL,
    storage_key    VARCHAR(255) NOT NULL,                 -- clé de l'objet dans le stockage
    password_hash  VARCHAR(255),                          -- NULL = pas de mot de passe (US01/US09)
    owner_id       UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = upload anonyme (US07)
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ  NOT NULL                  -- US01 : 7 jours par défaut ; US10
);

CREATE INDEX idx_stored_file_owner   ON stored_file (owner_id);
CREATE INDEX idx_stored_file_expires ON stored_file (expires_at);
