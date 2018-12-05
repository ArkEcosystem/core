CREATE INDEX IF NOT EXISTS "transactions_sender_public_key" ON ${schema~}.transactions ("sender_public_key");
CREATE INDEX IF NOT EXISTS "transactions_recipient_id" ON ${schema~}.transactions ("recipient_id");
