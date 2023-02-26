-- Your SQL goes here
ALTER TABLE algos DROP COLUMN version;
ALTER TABLE algos DROP COLUMN file;

-- Rename old non-unique names to unique names
UPDATE algos SET name = CONCAT(name, '_', id) WHERE name IN (SELECT name FROM algos GROUP BY name HAVING COUNT(*) > 1);

ALTER TABLE algos ADD CONSTRAINT unique_name UNIQUE (name, user_id);

CREATE TABLE algo_version (
    id SERIAL PRIMARY KEY,
    algo_id INTEGER NOT NULL REFERENCES algos(id),
    version VARCHAR NOT NULL,
    file bytea NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (algo_id, version)
);