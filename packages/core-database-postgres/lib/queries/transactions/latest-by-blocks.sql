SELECT block_id,
       serialized
FROM transactions
WHERE block_id IN ($1:list)
ORDER BY sequence ASC
