SELECT sender_public_key,
       serialized
FROM transactions
WHERE TYPE = 3
ORDER BY timestamp DESC, sequence ASC
