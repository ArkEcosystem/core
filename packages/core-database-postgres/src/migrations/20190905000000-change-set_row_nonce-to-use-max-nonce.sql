DROP TRIGGER transactions_set_nonce ON ${schema~}.transactions;

DROP FUNCTION ${schema~}.set_row_nonce();

CREATE FUNCTION ${schema~}.set_row_nonce() RETURNS TRIGGER
AS
$$
BEGIN
  SELECT COALESCE(MAX(nonce), 0) + 1 INTO NEW.nonce
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
