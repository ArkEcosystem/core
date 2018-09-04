SELECT serialized
FROM transactions
WHERE block_id = $1
ORDER BY sequence ASC
