-- Constraints
CREATE INDEX IF NOT EXISTS "transactions_block_id" ON ${schema~}.transactions ("block_id");
