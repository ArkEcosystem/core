SELECT id,
       generator_public_key,
       TIMESTAMP
FROM blocks
ORDER BY TIMESTAMP DESC LIMIT ${limit}
