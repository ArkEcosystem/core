SELECT
    id, amount, timestamp, vendor_field,
    sender_public_key, asset, recipient_id
FROM transactions
WHERE
    type = 8
AND id NOT IN (
    SELECT COALESCE(
        asset->'refund'->>'lockTransactionId',
        asset->'claim'->>'lockTransactionId'
    ) FROM transactions
        WHERE
    type IN (9, 10)
        AND
    type_group = 1
);
