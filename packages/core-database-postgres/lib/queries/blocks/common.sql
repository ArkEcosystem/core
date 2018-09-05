SELECT MAX("height") AS "height",
       "id",
       "previous_block",
       "timestamp"
FROM blocks
WHERE "id" IN ($1)
GROUP BY "id"
ORDER BY "height" DESC
