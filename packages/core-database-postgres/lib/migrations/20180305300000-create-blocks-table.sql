-- Table Definition
CREATE TABLE IF NOT EXISTS "blocks" (
    "id" varchar(64),
    "version" int2,
    "timestamp" int4,
    "previous_block" varchar(64),
    "height" int4,
    "number_of_transactions" int4,
    "total_amount" int8,
    "total_fee" int8,
    "reward" int8,
    "payload_length" int4,
    "payload_hash" varchar(64),
    "generator_public_key" varchar(66),
    "block_signature" varchar(256),
    "created_at" timestamptz,
    "updated_at" timestamptz,
    PRIMARY KEY ("id")
);
