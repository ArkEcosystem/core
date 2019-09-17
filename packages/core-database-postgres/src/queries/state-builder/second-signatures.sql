SELECT sender_public_key,
       asset
FROM transactions
WHERE type = 1 AND type_group = 1