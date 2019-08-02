ALTER TABLE ${schema~}.transactions DROP CONSTRAINT IF EXISTS "transactions_nonce";

DROP FUNCTION IF EXISTS ${schema~}.check_transaction_nonce(
  version_arg ${schema~}.transactions.version%TYPE,
  id_arg ${schema~}.transactions.id%TYPE,
  sender_public_key_arg ${schema~}.transactions.sender_public_key%TYPE,
  nonce_arg ${schema~}.transactions.nonce%TYPE,
  block_id_arg ${schema~}.blocks.id%TYPE,
  sequence_arg ${schema~}.transactions.sequence%TYPE
);

DROP FUNCTION IF EXISTS ${schema~}.set_nonces();

ALTER TABLE ${schema~}.transactions DROP COLUMN IF EXISTS nonce;
ALTER TABLE ${schema~}.transactions ADD COLUMN nonce BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_sender_nonce" ON
${schema~}.transactions ("sender_public_key", "nonce");

CREATE FUNCTION ${schema~}.set_nonces() RETURNS VOID
AS
$$
DECLARE
  current_row RECORD;
  i ${schema~}.transactions.nonce%TYPE;
  previous_sender_public_key ${schema~}.transactions.sender_public_key%TYPE := '';
BEGIN
  FOR current_row IN
    SELECT
    ${schema~}.transactions.sender_public_key,
    ${schema~}.transactions.id
    FROM
    ${schema~}.transactions,
    ${schema~}.blocks
    WHERE
    ${schema~}.transactions.block_id = blocks.id
    ORDER BY
    ${schema~}.transactions.sender_public_key,
    ${schema~}.blocks.height,
    ${schema~}.transactions.sequence
  LOOP
    IF current_row.sender_public_key != previous_sender_public_key THEN
      i := 1;
    END IF;
    UPDATE ${schema~}.transactions SET nonce = i WHERE id = current_row.id;
    previous_sender_public_key := current_row.sender_public_key;
    i := i + 1;
  END LOOP;
END;
$$
LANGUAGE PLPGSQL
VOLATILE;

SELECT ${schema~}.set_nonces();

DROP FUNCTION ${schema~}.set_nonces();

ALTER TABLE ${schema~}.transactions ALTER COLUMN nonce SET NOT NULL;

CREATE FUNCTION ${schema~}.set_row_nonce() RETURNS TRIGGER
AS
$$
BEGIN
  SELECT COUNT(*) + 1 INTO NEW.nonce
  FROM ${schema~}.transactions
  WHERE sender_public_key = NEW.sender_public_key;

  RETURN NEW;
END;
$$
LANGUAGE PLPGSQL
VOLATILE;

CREATE TRIGGER transactions_set_nonce
BEFORE INSERT
ON ${schema~}.transactions
FOR EACH ROW
WHEN (NEW.version = 1)
EXECUTE PROCEDURE ${schema~}.set_row_nonce();

CREATE FUNCTION check_transaction_nonce(
  version_arg ${schema~}.transactions.version%TYPE,
  id_arg ${schema~}.transactions.id%TYPE,
  sender_public_key_arg ${schema~}.transactions.sender_public_key%TYPE,
  nonce_arg ${schema~}.transactions.nonce%TYPE,
  block_id_arg ${schema~}.blocks.id%TYPE,
  sequence_arg ${schema~}.transactions.sequence%TYPE
) RETURNS BOOLEAN
AS
$$
DECLARE
  other_tx_with_same_nonce ${schema~}.transactions.id%TYPE;
  current_tx_block_height ${schema~}.blocks.height%TYPE;
  previous_tx_block_height ${schema~}.blocks.height%TYPE;
  previous_tx_sequence ${schema~}.transactions.sequence%TYPE;
  error_message_prefix TEXT;
BEGIN
  IF nonce_arg IS NULL THEN
    RAISE 'Invalid transaction: version=%, but nonce is NULL (id="%")', version_arg, id_arg;
  END IF;

  error_message_prefix := 'Invalid transaction (id="' || id_arg || '", sender_public_key="' ||
    sender_public_key_arg || '", nonce=' || nonce_arg || ')';

  IF nonce_arg < 0 THEN
    RAISE '%: negative nonce', error_message_prefix;
  END IF;

  -- First transaction from this sender.
  IF nonce_arg = 1 THEN
    RETURN TRUE;
  END IF;

  -- Check that a transaction from the same sender with nonce = nonce_arg - 1 exists
  -- and is ordered earlier in the blockchain.

  SELECT height INTO current_tx_block_height FROM ${schema~}.blocks WHERE id = block_id_arg;

  SELECT
  ${schema~}.blocks.height, ${schema~}.transactions.sequence INTO
  previous_tx_block_height, previous_tx_sequence
  FROM ${schema~}.transactions, ${schema~}.blocks
  WHERE
  ${schema~}.transactions.sender_public_key = sender_public_key_arg AND
  ${schema~}.transactions.nonce = nonce_arg - 1 AND
  ${schema~}.transactions.block_id = ${schema~}.blocks.id;

  IF NOT FOUND THEN
    RAISE '%: the previous transaction from the same sender does not exist (with nonce=%)',
    error_message_prefix, nonce_arg - 1;
  END IF;

  IF previous_tx_block_height > current_tx_block_height THEN
    RAISE '%: the previous transaction from the same sender (with nonce=%) is in a higher block (% > %)',
    error_message_prefix, nonce_arg - 1, previous_tx_block_height, current_tx_block_height;
  END IF;

  IF previous_tx_block_height = current_tx_block_height AND previous_tx_sequence >= sequence_arg THEN
    RAISE '%: the previous transaction from the same sender (with nonce=%) is in the same block (height=%) but with a bigger sequence (% >= %)',
    error_message_prefix, nonce_arg - 1, previous_tx_block_height, previous_tx_sequence, sequence_arg;
  END IF;

  RETURN TRUE;
END;
$$
LANGUAGE PLPGSQL
VOLATILE;

ALTER TABLE ${schema~}.transactions ADD CONSTRAINT "transactions_nonce"
CHECK (${schema~}.check_transaction_nonce(version, id, sender_public_key, nonce, block_id, sequence));
