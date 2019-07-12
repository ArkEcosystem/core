ALTER TABLE blocks DROP CONSTRAINT IF EXISTS "chained_blocks";

DROP FUNCTION IF EXISTS check_previous_block(
  id_arg VARCHAR(64),
  previous_block_arg VARCHAR(64),
  height_arg INTEGER
);

CREATE FUNCTION check_previous_block(
  id_arg VARCHAR(64),
  previous_block_arg VARCHAR(64),
  height_arg INTEGER
) RETURNS BOOLEAN
AS
$$
DECLARE
  block_id_at_height_minus1 VARCHAR(64);
  previous_block_height INTEGER;
  fail_reason TEXT;
BEGIN
  IF height_arg = 1 THEN
    RETURN TRUE;
  END IF;

  SELECT id INTO block_id_at_height_minus1 FROM blocks WHERE height = height_arg - 1;

  IF previous_block_arg = block_id_at_height_minus1 THEN
    RETURN TRUE;
  END IF;

  SELECT height INTO previous_block_height FROM blocks WHERE id = previous_block_arg;

  IF previous_block_height IS NULL THEN
    fail_reason := 'a block with id "' || previous_block_arg || '" does not exist';
  ELSE
    fail_reason := 'a block with id "' || previous_block_arg || '" exists but at an unexpected height ' ||
      previous_block_height || ' instead of ' || height_arg - 1;
  END IF;

  RAISE 'Cannot insert new block (id="%", height=%, previous_block="%") because %',
    id_arg, height_arg, previous_block_arg, fail_reason;
END;
$$
LANGUAGE PLPGSQL
VOLATILE;

ALTER TABLE blocks ADD CONSTRAINT "chained_blocks" CHECK (check_previous_block(id, previous_block, height));
