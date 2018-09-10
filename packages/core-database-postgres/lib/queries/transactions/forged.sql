SELECT id
FROM transactions
WHERE id IN (${ids:list})
