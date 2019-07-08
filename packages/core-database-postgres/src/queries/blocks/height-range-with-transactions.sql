SELECT *,
  (SELECT NULLIF(ARRAY
                   (SELECT encode(serialized, 'hex')
                    FROM transactions
                    WHERE transactions.block_id = blocks.id
					ORDER BY transactions.sender_public_key, transactions.nonce
				   ), '{}') AS transactions)
FROM blocks
WHERE height
    BETWEEN ${start} AND ${end}
ORDER BY height ASC
