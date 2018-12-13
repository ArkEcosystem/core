SELECT SUM ("number_of_transactions") AS "numberOfTransactions",
       SUM ("total_fee") AS "totalFee",
       SUM ("total_amount") AS "totalAmount",
       COUNT (DISTINCT "height") AS "count"
FROM blocks
