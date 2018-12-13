SELECT MAX("height") AS "height",
       "id",
       "previous_block",
       "timestamp"
FROM blocks
WHERE "id" IN (${ids:list})
GROUP BY "id"
ORDER BY "height" DESC
