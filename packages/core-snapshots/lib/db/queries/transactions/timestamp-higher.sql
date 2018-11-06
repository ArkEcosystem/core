SELECT id, sequence, serialized FROM transactions
WHERE timestamp > ${start}
