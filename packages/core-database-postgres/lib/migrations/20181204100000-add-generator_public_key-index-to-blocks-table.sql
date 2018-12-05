DROP INDEX IF EXISTS "blocks_unique";
CREATE INDEX IF NOT EXISTS "blocks_generator_public_key" ON ${schema~}.blocks ("generator_public_key");
