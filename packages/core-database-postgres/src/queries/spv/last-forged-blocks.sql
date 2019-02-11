SELECT id,
       height,
       generator_public_key,
       TIMESTAMP
FROM blocks
WHERE height IN (
  SELECT MAX(height) AS last_block_height
  FROM blocks
  GROUP BY generator_public_key
)
ORDER BY TIMESTAMP DESC
