-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.transactions (
    "id" VARCHAR(64),
    "version" SMALLINT,
    "block_id" VARCHAR(64),
    "sequence" SMALLINT,
    "timestamp" INTEGER,
    "sender_public_key" VARCHAR(66),
    "recipient_id" VARCHAR(36),
    "type" SMALLINT,
    "vendor_field_hex" bytea,
    "amount" BIGINT,
    "fee" BIGINT,
    "serialized" bytea,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_unique" ON votes ("senderPublicKey", "recipientId", "vendorFieldHex", "timestamp");
