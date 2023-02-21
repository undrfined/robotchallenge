-- Your SQL goes here
CREATE TABLE algos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    file bytea NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);