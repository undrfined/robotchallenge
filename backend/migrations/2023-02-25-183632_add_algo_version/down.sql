-- This file should undo anything in `up.sql`
ALTER TABLE algos ADD COLUMN version VARCHAR NOT NULL DEFAULT('0.0.1');
ALTER TABLE algos ADD COLUMN file bytea NOT NULL DEFAULT('0x');
ALTER TABLE algos DROP CONSTRAINT unique_name;
DROP TABLE algo_version;