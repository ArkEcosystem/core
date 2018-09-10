-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.rounds (
    id SERIAL,
    "public_key" VARCHAR(66),
    "balance" BIGINT,
    "round" BIGINT,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "rounds_unique" ON rounds ("public_key", "round");
