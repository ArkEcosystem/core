SELECT sender_public_key,
       SUM ("amount") AS "amount",
           SUM ("fee") AS "fee"
FROM transactions
GROUP BY "sender_public_key"
