SELECT *
FROM blocks
WHERE height BETWEEN ${start} AND ${end}
ORDER BY height ASC
