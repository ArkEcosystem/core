SELECT block_id,
       serialized
FROM transactions
WHERE block_id IN (${ids:list})
ORDER BY sequence ASC
