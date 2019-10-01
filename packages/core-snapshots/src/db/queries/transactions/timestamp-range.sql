SELECT
  id,
  version,
  nonce,
  block_id,
  sequence,
  timestamp,
  sender_public_key,
  recipient_id,
  type,
  type_group,
  vendor_field_hex,
  amount,
  fee,
  serialized,
  asset
FROM
  transactions
WHERE
  timestamp BETWEEN ${start} AND ${end}
ORDER BY
  timestamp,
  sequence
