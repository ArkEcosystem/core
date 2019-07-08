SELECT id, serialized FROM transactions
WHERE timestamp > ${start}
