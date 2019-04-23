SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 3
ORDER BY timestamp DESC, sequence ASC
