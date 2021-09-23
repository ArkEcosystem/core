SELECT id, sequence, serialized FROM transactions
WHERE timestamp > ${start}
ORDER BY timestamp, sequence
