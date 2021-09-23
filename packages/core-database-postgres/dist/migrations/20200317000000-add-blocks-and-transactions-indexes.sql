CREATE INDEX IF NOT EXISTS "transactions_asset" ON ${schema~}.transactions USING gin (asset);
CREATE INDEX IF NOT EXISTS "transactions_amount" ON ${schema~}.transactions ("amount");
CREATE INDEX IF NOT EXISTS "transactions_fee" ON ${schema~}.transactions ("fee");
CREATE INDEX IF NOT EXISTS "transactions_nonce_idx" ON ${schema~}.transactions ("nonce");
CREATE INDEX IF NOT EXISTS "transactions_vendor_field" ON ${schema~}.transactions ("vendor_field");
CREATE INDEX IF NOT EXISTS "transactions_version" ON ${schema~}.transactions ("version");

CREATE INDEX IF NOT EXISTS "transactions_amount_sequence" ON ${schema~}.transactions ("amount","sequence");
CREATE INDEX IF NOT EXISTS "transactions_fee_sequence" ON ${schema~}.transactions ("fee","sequence");
CREATE INDEX IF NOT EXISTS "transactions_nonce_sequence" ON ${schema~}.transactions ("nonce","sequence");
CREATE INDEX IF NOT EXISTS "transactions_timestamp_sequence" ON ${schema~}.transactions ("timestamp","sequence");
CREATE INDEX IF NOT EXISTS "transactions_type_sequence" ON ${schema~}.transactions ("type","sequence");
CREATE INDEX IF NOT EXISTS "transactions_type_group_sequence" ON ${schema~}.transactions ("type_group","sequence");
CREATE INDEX IF NOT EXISTS "transactions_vendor_field_sequence" ON ${schema~}.transactions ("vendor_field","sequence");
CREATE INDEX IF NOT EXISTS "transactions_version_sequence" ON ${schema~}.transactions ("version","sequence");

CREATE INDEX IF NOT EXISTS "transactions_amount_asc_sequence" ON ${schema~}.transactions ("amount" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_fee_asc_sequence" ON ${schema~}.transactions ("fee" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_nonce_asc_sequence" ON ${schema~}.transactions ("nonce" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_timestamp_asc_sequence" ON ${schema~}.transactions ("timestamp" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_type_asc_sequence" ON ${schema~}.transactions ("type" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_type_group_asc_sequence" ON ${schema~}.transactions ("type_group" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_vendor_field_asc_sequence" ON ${schema~}.transactions ("vendor_field" ASC,"sequence" DESC);
CREATE INDEX IF NOT EXISTS "transactions_version_asc_sequence" ON ${schema~}.transactions ("version" ASC,"sequence" DESC);

CREATE INDEX IF NOT EXISTS "blocks_number_of_transactions" ON ${schema~}.blocks ("number_of_transactions");
CREATE INDEX IF NOT EXISTS "blocks_reward" ON ${schema~}.blocks ("reward");
CREATE INDEX IF NOT EXISTS "blocks_total_amount" ON ${schema~}.blocks ("total_amount");
CREATE INDEX IF NOT EXISTS "blocks_total_fee" ON ${schema~}.blocks ("total_fee");
CREATE INDEX IF NOT EXISTS "blocks_version" ON ${schema~}.blocks ("version");
