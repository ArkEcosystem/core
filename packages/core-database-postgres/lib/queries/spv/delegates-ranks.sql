SELECT public_key,
       vote_balance,
       missed_blocks
FROM wallets
WHERE username IS NOT NULL
ORDER BY vote_balance DESC,
         public_key ASC
