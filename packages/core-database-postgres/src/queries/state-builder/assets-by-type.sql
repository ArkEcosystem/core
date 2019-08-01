SELECT sender_public_key,
       timestamp,
       asset,
       version,
       id,
       fee,
       amount,
       recipient_id
FROM transactions
WHERE TYPE = ${type}
ORDER BY timestamp ASC, sequence ASC
