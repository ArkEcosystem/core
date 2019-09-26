SELECT
  round,
  balance,
  public_key
FROM
  rounds
WHERE
  round BETWEEN ${startRound} AND ${endRound}
ORDER BY
  round, balance DESC, public_key
