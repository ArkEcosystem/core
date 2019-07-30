ALTER TABLE ${schema~}.transactions DROP COLUMN IF EXISTS nonce;
ALTER TABLE ${schema~}.transactions ADD COLUMN nonce BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_sender_nonce" ON
${schema~}.transactions ("sender_public_key", "nonce");

ALTER TABLE ${schema~}.transactions DROP CONSTRAINT IF EXISTS "transactions_nonce";

DROP FUNCTION IF EXISTS check_transaction_nonce(
  version_arg ${schema~}.transactions.version%TYPE,
  id_arg ${schema~}.transactions.id%TYPE,
  sender_public_key_arg ${schema~}.transactions.sender_public_key%TYPE,
  nonce_arg ${schema~}.transactions.nonce%TYPE,
  block_id_arg ${schema~}.blocks.id%TYPE,
  sequence_arg ${schema~}.transactions.sequence%TYPE
);

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
  IF version_arg = 1 THEN
    RETURN TRUE;
  END IF;

  IF nonce_arg IS NULL THEN
    RAISE 'Invalid transaction: version=%, but nonce is NULL (id="%")', version_arg, id_arg;
  END IF;

  error_message_prefix := 'Invalid transaction (id="' || id_arg || '", sender_public_key="' ||
    sender_public_key_arg || '", nonce=' || nonce_arg || ')';

  IF nonce_arg < 0 THEN
    RAISE '%: negative nonce', error_message_prefix;
  END IF;

  -- First transaction from this sender.
  IF nonce_arg = 0 THEN
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
CHECK (check_transaction_nonce(version, id, sender_public_key, nonce, block_id, sequence));
