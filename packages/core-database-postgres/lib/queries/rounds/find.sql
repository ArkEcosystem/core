SELECT *
FROM rounds
WHERE round = $1
ORDER BY balance DESC,
         public_key ASC
