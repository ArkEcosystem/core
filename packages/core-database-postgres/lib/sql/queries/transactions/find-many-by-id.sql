SELECT serialized,
       block_id
FROM transactions
WHERE id IN ($1)
