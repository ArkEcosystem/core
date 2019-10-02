SELECT
NULL AS sender_public_key,
a."recipientId" AS recipient_id,
SUM(a."amount") AS amount
FROM
transactions
CROSS JOIN LATERAL
JSONB_TO_RECORDSET(transactions.asset->'payments') AS a("recipientId" TEXT, "amount" BIGINT)
WHERE
transactions.type = 6
GROUP BY a."recipientId"
UNION
SELECT
transactions.sender_public_key AS sender_public_key,
NULL AS recipient_id,
SUM(a."amount") AS amount
FROM
transactions
CROSS JOIN LATERAL
JSONB_TO_RECORDSET(transactions.asset->'payments') AS a("recipientId" TEXT, "amount" BIGINT)
WHERE
transactions.type = 6
GROUP BY
transactions.sender_public_key
LIMIT ${limit} OFFSET ${offset}
