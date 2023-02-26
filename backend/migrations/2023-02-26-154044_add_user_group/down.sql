-- This file should undo anything in `up.sql`
ALTER TABLE users DROP COLUMN user_group_id;
DROP TABLE user_groups;