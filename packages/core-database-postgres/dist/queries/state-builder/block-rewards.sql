SELECT generator_public_key,
       SUM ("reward"+"total_fee") AS "reward"
FROM blocks
GROUP BY "generator_public_key"
