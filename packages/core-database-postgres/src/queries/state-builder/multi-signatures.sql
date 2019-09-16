SELECT sender_public_key,
       asset,
       version
FROM transactions
WHERE TYPE = 4 AND TYPE_GROUP = 1
ORDER BY (timestamp + sequence) DESC
