CREATE INDEX IF NOT EXISTS "transactions_asset" ON transactions USING gin (asset);
CREATE INDEX IF NOT EXISTS "transactions_amount" ON transactions("amount");
CREATE INDEX IF NOT EXISTS "transactions_fee" ON transactions("fee");
CREATE INDEX IF NOT EXISTS "transactions_nonce" ON transactions("nonce");
CREATE INDEX IF NOT EXISTS "transactions_vendor_field" ON transactions("vendorField");
CREATE INDEX IF NOT EXISTS "transactions_version" ON transactions("version");

CREATE INDEX IF NOT EXISTS "transactions_amount_sequence" ON transactions("amount","sequence");
CREATE INDEX IF NOT EXISTS "transactions_fee_sequence" ON transactions("fee","sequence");
CREATE INDEX IF NOT EXISTS "transactions_nonce_sequence" ON transactions("nonce","sequence");
CREATE INDEX IF NOT EXISTS "transactions_timestamp_sequence" ON transactions("timestamp","sequence");
CREATE INDEX IF NOT EXISTS "transactions_type_sequence" ON transactions("type","sequence");
CREATE INDEX IF NOT EXISTS "transactions_type_group_sequence" ON transactions("type_group","sequence");
CREATE INDEX IF NOT EXISTS "transactions_vendor_field_sequence" ON transactions("vendor_field","sequence");
CREATE INDEX IF NOT EXISTS "transactions_version_sequence" ON transactions("version","sequence");

CREATE INDEX IF NOT EXISTS "transactions_amount_asc_sequence" ON transactions("amount" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_fee_asc_sequence" ON transactions("fee" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_nonce_asc_sequence" ON transactions("nonce" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_timestamp_asc_sequence" ON transactions("timestamp" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_type_asc_sequence" ON transactions("type" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_type_group_asc_sequence" ON transactions("type_group" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_vendor_field_asc_sequence" ON transactions("vendor_field" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_version_asc_sequence" ON transactions("version" ASC,"sequence" DESC);

CREATE INDEX IF NOT EXISTS "blocks_number_of_transactions" ON blocks ("number_of_transactions");
CREATE INDEX IF NOT EXISTS "blocks_reward" ON blocks ("reward");
CREATE INDEX IF NOT EXISTS "blocks_total_amount" ON blocks ("total_amount");
CREATE INDEX IF NOT EXISTS "blocks_total_fee" ON blocks ("total_fee");
CREATE INDEX IF NOT EXISTS "blocks_version" ON blocks ("version");