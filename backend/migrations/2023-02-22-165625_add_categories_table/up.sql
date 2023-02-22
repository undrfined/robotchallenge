-- Your SQL goes here
CREATE TYPE category_icon AS ENUM ('lightning', 'robot', 'diamond', 'crown');
CREATE TABLE categories(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR NOT NULL,
    description_short VARCHAR NOT NULL,
    game_config JSONB NOT NULL,
    max_points INTEGER NOT NULL,
    icon category_icon NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);