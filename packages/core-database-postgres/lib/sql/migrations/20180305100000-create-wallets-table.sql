-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.wallets (
    "address" varchar(36),
    "public_key" varchar(66),
    "second_public_key" varchar(66),
    "vote" varchar(66),
    "username" varchar(64),
    "balance" int8,
    "vote_balance" int8,
    "produced_blocks" int8,
    "missed_blocks" int8,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("address")
);
