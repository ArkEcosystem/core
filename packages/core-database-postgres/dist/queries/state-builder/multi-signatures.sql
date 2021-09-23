SELECT sender_public_key,
       asset,
       version
FROM transactions
WHERE type = 4 AND type_group = 1
ORDER BY (timestamp + sequence) DESC
