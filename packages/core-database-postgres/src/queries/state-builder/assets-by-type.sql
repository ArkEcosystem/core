SELECT transactions.sender_public_key,
       transactions.timestamp,
       transactions.asset,
       transactions.version,
       transactions.id,
       transactions.fee,
       transactions.amount,
       transactions.recipient_id,
       transactions.block_id,
       blocks.height as "blockHeight",
       blocks.generator_public_key as "blockGeneratorPublicKey",
       blocks.reward as "blockReward"
FROM transactions, blocks
WHERE 
    transactions.block_id = blocks.id
AND
    transactions.type = ${type}
AND
    transactions.type_group = ${typeGroup}
ORDER BY transactions.timestamp ASC, transactions.sequence ASC
LIMIT ${limit} OFFSET ${offset}