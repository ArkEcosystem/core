-- Sequence
CREATE SEQUENCE IF NOT EXISTS "rounds_id_seq";

-- Table Definition
CREATE TABLE IF NOT EXISTS "rounds" (
    "id" int4 DEFAULT nextval('rounds_id_seq'::regclass),
    "public_key" varchar(66),
    "balance" int8,
    "round" int8,
    "created_at" timestamptz,
    "updated_at" timestamptz,
    PRIMARY KEY ("id")
);
