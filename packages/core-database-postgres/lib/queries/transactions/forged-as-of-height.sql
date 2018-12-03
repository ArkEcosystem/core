SELECT transactions.id AS id
FROM transactions, blocks
WHERE
transactions.id IN (${ids:list}) AND
transactions.block_id = blocks.id AND
blocks.height <= ${asOfHeight}
