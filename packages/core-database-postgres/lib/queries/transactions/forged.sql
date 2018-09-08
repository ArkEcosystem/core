SELECT id
FROM transactions
WHERE id IN ($1:list)
