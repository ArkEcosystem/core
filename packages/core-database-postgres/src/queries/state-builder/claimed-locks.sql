SELECT
	SUM(amount) as "amount", recipient_id
FROM
	transactions
WHERE
	id
IN (
	SELECT asset->'claim'->>'lockTransactionId'
	FROM
		transactions
	WHERE
		type IN (9)
	AND
		type_group = 1
)
GROUP BY
	recipient_id;