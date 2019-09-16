SELECT recipient_id,
       SUM ("amount") AS "amount"
FROM transactions
WHERE TYPE = 0 AND TYPE_GROUP = 1
GROUP BY "recipient_id"
