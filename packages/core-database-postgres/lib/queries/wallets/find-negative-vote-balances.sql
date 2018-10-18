SELECT COUNT (DISTINCT "address") AS "count"
FROM wallets
WHERE vote_balance < 0;
