-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.migrations (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL
);
