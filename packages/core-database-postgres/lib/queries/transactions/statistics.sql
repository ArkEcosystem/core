SELECT COUNT (DISTINCT "id") AS "count",
       SUM ("fee") AS "totalFee",
       SUM ("amount") AS "totalAmount"
FROM transactions
