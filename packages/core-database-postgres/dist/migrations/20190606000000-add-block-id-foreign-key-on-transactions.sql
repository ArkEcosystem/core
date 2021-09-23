ALTER TABLE transactions DROP CONSTRAINT IF EXISTS "transactions_block_id_fkey";
ALTER TABLE transactions ADD CONSTRAINT "transactions_block_id_fkey" FOREIGN KEY (block_id) REFERENCES blocks (id);
