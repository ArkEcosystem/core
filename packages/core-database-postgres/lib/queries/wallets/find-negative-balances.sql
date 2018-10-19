SELECT COUNT (DISTINCT "address") AS "count"
FROM wallets
WHERE balance < 0;
