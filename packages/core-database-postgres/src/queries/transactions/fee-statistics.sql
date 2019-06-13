SELECT 
    type, 
    AVG(fee)::int8 as "avg",
    MIN(fee)::int8 as "min",
    MAX(fee)::int8 as "max",
    SUM(fee)::int8 as "sum"
FROM 
    transactions 
WHERE 
    transactions.timestamp >= ${age} AND fee >= ${minFee}
GROUP BY
    type
ORDER BY
    type