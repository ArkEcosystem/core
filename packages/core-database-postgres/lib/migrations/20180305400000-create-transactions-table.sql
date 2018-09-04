-- Table Definition
CREATE TABLE "public"."transactions" (
    "id" varchar(64),
    "version" int2,
    "block_id" varchar(64),
    "sequence" int2,
    "timestamp" int4,
    "sender_public_key" varchar(66),
    "recipient_id" varchar(36),
    "type" int2,
    "vendor_field_hex" bytea,
    "amount" int8,
    "fee" int8,
    "serialized" bytea,
    "created_at" timestamptz,
    "updated_at" timestamptz,
    PRIMARY KEY ("id")
);
