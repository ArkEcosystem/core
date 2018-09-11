SELECT *
FROM rounds
WHERE round = ${round}
ORDER BY balance DESC,
         public_key ASC
