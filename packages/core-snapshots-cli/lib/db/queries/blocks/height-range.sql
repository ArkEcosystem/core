SELECT
  id,
  version,
  timestamp,
  previous_block,
  height,
  number_of_transactions,
  total_amount,
  total_fee,
  reward,
  payload_length,
  payload_hash,
  generator_public_key,
  block_signature
FROM
  blocks
WHERE
  height BETWEEN ${start} AND ${end}
ORDER BY
  height
