SELECT sender_public_key,
       serialized
FROM transactions
WHERE TYPE = 4
ORDER BY created_at DESC
