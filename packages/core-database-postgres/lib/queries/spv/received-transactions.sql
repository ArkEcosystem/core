SELECT recipient_id,
       SUM ("amount") AS "amount"
FROM transactions
WHERE TYPE = 0
GROUP BY "recipient_id"
