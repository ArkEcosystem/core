SELECT recipient_id,
       SUM ("amount") AS "amount"
FROM transactions
WHERE type = 0 AND type_group = 1
GROUP BY "recipient_id"
