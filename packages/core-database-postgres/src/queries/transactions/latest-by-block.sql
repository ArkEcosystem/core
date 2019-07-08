SELECT id, serialized
FROM transactions
WHERE block_id = ${id}
ORDER BY sender_public_key, nonce
