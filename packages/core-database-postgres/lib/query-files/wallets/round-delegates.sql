SELECT "vote" AS "publicKey",
       SUM ("balance") AS "balance"
FROM wallets
WHERE vote IS NOT NULL
GROUP BY "vote"
