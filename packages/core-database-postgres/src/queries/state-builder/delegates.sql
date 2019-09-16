SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 2 AND TYPE_GROUP = 1