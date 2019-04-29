SELECT
  id,
  public_key,
  balance,
  round
FROM
  rounds
WHERE
  round BETWEEN ${start} AND ${end}
ORDER BY
  round
