SELECT public_key,
       0 AS balance
FROM wallets
WHERE username IS NOT NULL
ORDER BY public_key ASC LIMIT ${limit}
