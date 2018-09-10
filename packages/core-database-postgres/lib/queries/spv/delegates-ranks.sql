SELECT public_key,
       vote_balance,
       missed_blocks
FROM wallets
WHERE public_key IN (${publicKeys:list})
ORDER BY vote_balance DESC,
         public_key ASC
