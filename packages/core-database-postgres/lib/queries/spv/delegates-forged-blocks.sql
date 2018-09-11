SELECT generator_public_key,
       SUM ("total_fee") AS "total_fees",
       SUM ("reward") AS "total_rewards",
       COUNT ("total_amount") AS "total_produced"
FROM blocks
WHERE generator_public_key IN (${publicKeys:list})
GROUP BY "generator_public_key"
