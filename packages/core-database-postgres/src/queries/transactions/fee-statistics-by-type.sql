SELECT
    type_group,
    type,
    AVG(fee)::int8 as "avg",
    MIN(fee)::int8 as "min",
    MAX(fee)::int8 as "max",
    SUM(fee)::int8 as "sum"
FROM
(
    SELECT *
    FROM
        transactions
    WHERE
        type = ${type} AND type_group = ${typeGroup}
    ORDER BY
        timestamp DESC
    LIMIT
        20
) subquery
GROUP BY type_group, type;
