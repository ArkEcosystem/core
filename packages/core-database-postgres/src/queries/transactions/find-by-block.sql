SELECT id, serialized
FROM transactions
WHERE block_id = ${id}
