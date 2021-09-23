SELECT COUNT(id) as "count"
FROM transactions
WHERE type = ${type} AND type_group = ${typeGroup}
