SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 5
ORDER BY timestamp DESC, sender_public_key, nonce
