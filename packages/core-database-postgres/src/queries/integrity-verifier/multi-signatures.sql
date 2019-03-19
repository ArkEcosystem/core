SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 4
ORDER BY (timestamp + sequence) DESC
