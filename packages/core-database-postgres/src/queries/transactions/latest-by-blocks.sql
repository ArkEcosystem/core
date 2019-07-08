SELECT id,
       block_id,
       serialized
FROM transactions
WHERE block_id IN (${ids:list})
ORDER BY sender_public_key, nonce
