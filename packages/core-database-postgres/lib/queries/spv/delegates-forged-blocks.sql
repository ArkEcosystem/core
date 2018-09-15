SELECT generator_public_key,
       SUM ("total_fee") AS "total_fees",
       SUM ("reward") AS "total_rewards",
       COUNT ("total_amount") AS "total_produced"
FROM blocks
GROUP BY "generator_public_key"
