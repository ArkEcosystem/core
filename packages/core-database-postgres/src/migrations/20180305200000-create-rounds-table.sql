-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.rounds (
    "id" SERIAL PRIMARY KEY,
    "public_key" VARCHAR(66) NOT NULL,
    "balance" BIGINT NOT NULL,
    "round" BIGINT NOT NULL
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "rounds_unique" ON rounds ("round", "public_key");
