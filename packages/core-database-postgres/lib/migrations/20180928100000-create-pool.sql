-- Table Definition
CREATE TABLE IF NOT EXISTS pool (
    "id" VARCHAR(64) PRIMARY KEY,
    "sequence" BIGSERIAL UNIQUE,
    "sender_public_key" VARCHAR(66) NOT NULL,
    "serialized" TEXT NOT NULL
);

-- Comments
COMMENT ON TABLE pool IS
  'Transactions pool - a list of transactions that have not yet been forged';
COMMENT ON COLUMN pool.id IS
  'Id of the transaction';
COMMENT ON COLUMN pool.sequence IS
  'Monotonically increasing unique number. Used to get transactions in insertion order';
COMMENT ON COLUMN pool.sender_public_key IS
  'Public key of the sender of the transaction';
COMMENT ON COLUMN pool.serialized IS
  'Raw transaction, serialized to a string';

-- Constraints
CREATE INDEX IF NOT EXISTS "pool_sender" ON pool ("sender_public_key");
