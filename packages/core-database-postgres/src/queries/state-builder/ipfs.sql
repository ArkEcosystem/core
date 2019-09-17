SELECT sender_public_key,
       asset
FROM transactions
WHERE type = 5 AND type_group = 1
ORDER BY timestamp DESC, sequence ASC
