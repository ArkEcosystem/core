ALTER TABLE rounds DROP COLUMN id, ADD PRIMARY KEY (round, public_key);
DROP INDEX rounds_unique;
