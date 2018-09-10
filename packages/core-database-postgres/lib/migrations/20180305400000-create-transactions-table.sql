-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.transactions (
    "id" VARCHAR(64) PRIMARY KEY,
    "version" SMALLINT NOT NULL,
    "block_id" VARCHAR(64) NOT NULL,
    "sequence" SMALLINT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "sender_public_key" VARCHAR(66) NOT NULL,
    "recipient_id" VARCHAR(36),
    "type" SMALLINT NOT NULL,
    "vendor_field_hex" bytea,
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL,
    "serialized" bytea NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

-- Constraints
CREATE INDEX IF NOT EXISTS "transactions_unique" ON transactions ("sender_public_key", "recipient_id", "vendor_field_hex", "timestamp");
