CREATE INDEX IF NOT EXISTS "blocks_generator_public_key_height" ON ${schema~}.blocks ("generator_public_key", "height");
