SELECT public_key,
       0 AS balance
FROM wallets
WHERE username IS NOT NULL
  AND public_key NOT IN ($1)
ORDER BY public_key ASC LIMIT $2
