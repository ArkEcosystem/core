SELECT
  id,
  public_key,
  balance,
  round
FROM
  rounds
WHERE
  round BETWEEN ${startRound} AND ${endRound} AND
  id >= ${startId}
ORDER BY
  id
