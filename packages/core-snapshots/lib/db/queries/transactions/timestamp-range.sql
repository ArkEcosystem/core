SELECT
  id,
  version,
  block_id,
  sequence,
  timestamp,
  sender_public_key,
  recipient_id,
  type,
  vendor_field_hex,
  amount,
  fee,
  serialized
FROM
  transactions
WHERE
  timestamp BETWEEN ${start} AND ${end}
ORDER BY
  timestamp
