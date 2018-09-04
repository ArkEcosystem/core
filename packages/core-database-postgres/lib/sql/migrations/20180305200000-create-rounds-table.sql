-- Sequence
CREATE SEQUENCE IF NOT EXISTS ${schema~}.rounds_id_seq;

-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.rounds (
    "id" int4 DEFAULT nextval('rounds_id_seq'::regclass),
    "public_key" varchar(66),
    "balance" int8,
    "round" int8,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);
