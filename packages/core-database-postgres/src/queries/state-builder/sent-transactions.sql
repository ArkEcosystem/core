SELECT sender_public_key,
       SUM ("amount") AS "amount",
    SUM ("fee") AS "fee",
    MAX ("nonce") AS "nonce"
FROM transactions
GROUP BY "sender_public_key"
