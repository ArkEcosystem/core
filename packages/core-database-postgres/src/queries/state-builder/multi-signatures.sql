SELECT sender_public_key,
       asset,
       version
FROM transactions
WHERE TYPE = 4
ORDER BY timestamp DESC, sender_public_key, nonce
