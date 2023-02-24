-- This file should undo anything in `up.sql`
ALTER TABLE algos DROP COLUMN name;
ALTER TABLE algos DROP COLUMN version;
ALTER TABLE algos DROP COLUMN language;
