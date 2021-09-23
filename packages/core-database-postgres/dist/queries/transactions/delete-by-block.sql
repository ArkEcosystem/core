DELETE
FROM transactions
WHERE block_id IN (${ids:list})
