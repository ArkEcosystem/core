ALTER TABLE transactions DROP COLUMN IF EXISTS nonce;
ALTER TABLE transactions ADD COLUMN nonce BIGINT NOT NULL DEFAULT 0;
