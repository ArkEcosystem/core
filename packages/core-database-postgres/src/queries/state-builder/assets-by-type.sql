SELECT sender_public_key,
       timestamp,
       asset,
       version,
       id,
       fee,
       amount,
       recipient_id
FROM transactions
WHERE type = ${type} AND type_group = ${typeGroup}
ORDER BY timestamp ASC, sequence ASC
LIMIT ${limit} OFFSET ${offset}