SELECT
	SUM(amount) as "amount", sender_public_key
FROM
	transactions
WHERE
	id
IN (
	SELECT asset->'refund'->>'lockTransactionId'
	FROM
		transactions
	WHERE
		type IN (10)
	AND
		type_group = 1
)
GROUP BY
	sender_public_key;