-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.wallets (
    "address" VARCHAR(36) PRIMARY KEY NOT NULL,
    "public_key" VARCHAR(66) UNIQUE NOT NULL,
    "second_public_key" VARCHAR(66) UNIQUE,
    "vote" VARCHAR(66),
    "username" VARCHAR(64) UNIQUE,
    "balance" BIGINT NOT NULL,
    "vote_balance" BIGINT NOT NULL,
    "produced_blocks" BIGINT NOT NULL,
    "missed_blocks" BIGINT NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "wallets_votes_unique" ON wallets ("public_key", "vote");
