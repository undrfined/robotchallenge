-- Your SQL goes here
ALTER TABLE algos ADD COLUMN name VARCHAR NOT NULL DEFAULT('Default');
ALTER TABLE algos ADD COLUMN version VARCHAR NOT NULL DEFAULT('0.0.1');
ALTER TABLE algos ADD COLUMN language VARCHAR NOT NULL DEFAULT('c');