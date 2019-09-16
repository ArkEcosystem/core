SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 5 AND TYPE_GROUP = 1
ORDER BY timestamp DESC, sequence ASC
