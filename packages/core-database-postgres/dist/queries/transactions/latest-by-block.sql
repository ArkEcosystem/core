SELECT id, serialized
FROM transactions
WHERE block_id = ${id}
ORDER BY sequence ASC
