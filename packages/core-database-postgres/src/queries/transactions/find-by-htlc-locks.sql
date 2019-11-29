SELECT *
FROM transactions
WHERE 
    type IN (9, 10) 
AND 
    type_group = 1
AND
(
    asset->'refund'->'lockTransactionId' ?| array[${ids}]
OR
    asset->'claim'->'lockTransactionId' ?| array[${ids}]
)
