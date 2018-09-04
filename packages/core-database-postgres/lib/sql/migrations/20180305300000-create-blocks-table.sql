-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.blocks (
    "id" VARCHAR(64) UNIQUE,
    "version" SMALLINT,
    "timestamp" INTEGER,
    "previous_block" VARCHAR(64),
    "height" INTEGER,
    "number_of_transactions" INTEGER,
    "total_amount" BIGINT,
    "total_fee" BIGINT,
    "reward" BIGINT,
    "payload_length" INTEGER,
    "payload_hash" VARCHAR(64),
    "generator_public_key" VARCHAR(66),
    "block_signature" VARCHAR(256),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "blocks_unique" ON votes ("height", "generatorPublicKey");
