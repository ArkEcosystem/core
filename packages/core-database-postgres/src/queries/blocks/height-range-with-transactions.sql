SELECT *,
  (SELECT NULLIF(ARRAY
                   (SELECT encode(serialized, 'hex')
                    FROM transactions
                    WHERE transactions.block_id = blocks.id
					ORDER BY transactions.sequence ASC
				   ), '{}') AS transactions)
FROM blocks
WHERE height
    BETWEEN ${start} AND ${end}
ORDER BY height ASC