-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.wallets (
    "address" VARCHAR(36),
    "public_key" VARCHAR(66) UNIQUE,
    "second_public_key" VARCHAR(66) UNIQUE,
    "vote" VARCHAR(66),
    "username" VARCHAR(64) UNIQUE,
    "balance" BIGINT,
    "vote_balance" BIGINT,
    "produced_blocks" BIGINT,
    "missed_blocks" BIGINT,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("address")
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "wallets_unique" ON votes ("address", "publicKey", "vote", "username");
