import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNonceColumnToTransactionsTable20190806000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions ADD COLUMN nonce BIGINT;
            CREATE UNIQUE INDEX "transactions_sender_nonce" ON transactions ("sender_public_key", "nonce");

            CREATE FUNCTION set_nonces() RETURNS VOID
            AS
            $$
            DECLARE
                current_row RECORD;
                i transactions.nonce%TYPE;
                previous_sender_public_key transactions.sender_public_key%TYPE := '';
            BEGIN
                FOR current_row IN
                    SELECT
                        transactions.sender_public_key,
                        transactions.id
                    FROM
                        transactions,
                        blocks
                    WHERE
                        transactions.block_id = blocks.id
                    ORDER BY
                        transactions.sender_public_key,
                        blocks.height,
                        transactions.sequence
                LOOP
                    IF current_row.sender_public_key != previous_sender_public_key THEN
                        i := 1;
                    END IF;
                    UPDATE transactions SET nonce = i WHERE id = current_row.id;
                    previous_sender_public_key := current_row.sender_public_key;
                    i := i + 1;
                END LOOP;
            END;
            $$
            LANGUAGE PLPGSQL
            VOLATILE;

            SELECT set_nonces();
            DROP FUNCTION set_nonces();

            ALTER TABLE transactions ALTER COLUMN nonce SET NOT NULL;

            CREATE FUNCTION set_row_nonce() RETURNS TRIGGER
            AS
            $$
            BEGIN
                SELECT COUNT(*) + 1 INTO NEW.nonce
                FROM transactions
                WHERE sender_public_key = NEW.sender_public_key;

                RETURN NEW;
            END;
            $$
            LANGUAGE PLPGSQL
            VOLATILE;

            CREATE TRIGGER transactions_set_nonce
            BEFORE INSERT
            ON transactions
            FOR EACH ROW
            WHEN (NEW.version = 1)
            EXECUTE PROCEDURE set_row_nonce();

            CREATE FUNCTION check_transaction_nonce(
                version_arg transactions.version%TYPE,
                id_arg transactions.id%TYPE,
                sender_public_key_arg transactions.sender_public_key%TYPE,
                nonce_arg transactions.nonce%TYPE,
                block_id_arg blocks.id%TYPE,
                sequence_arg transactions.sequence%TYPE
            ) RETURNS BOOLEAN
            AS
            $$
            DECLARE
                other_tx_with_same_nonce transactions.id%TYPE;
                current_tx_block_height blocks.height%TYPE;
                previous_tx_block_height blocks.height%TYPE;
                previous_tx_sequence transactions.sequence%TYPE;
                error_message_prefix TEXT;
            BEGIN
                IF nonce_arg IS NULL THEN
                    RAISE 'Invalid transaction: version=%, but nonce is NULL (id="%")', version_arg, id_arg;
                END IF;

                error_message_prefix :=
                    'Invalid transaction (id="' || id_arg ||
                    '", sender_public_key="' || sender_public_key_arg ||
                    '", nonce=' || nonce_arg || ')';

                IF nonce_arg < 0 THEN
                    RAISE '%: negative nonce', error_message_prefix;
                END IF;

                -- First transaction from this sender.
                IF nonce_arg = 1 THEN
                    RETURN TRUE;
                END IF;

                -- Check that a transaction from the same sender with nonce = nonce_arg - 1 exists
                -- and is ordered earlier in the blockchain.

                SELECT height INTO current_tx_block_height FROM blocks WHERE id = block_id_arg;

                SELECT
                    blocks.height, transactions.sequence INTO
                    previous_tx_block_height, previous_tx_sequence
                    FROM transactions, blocks
                WHERE
                    transactions.sender_public_key = sender_public_key_arg AND
                    transactions.nonce = nonce_arg - 1 AND
                    transactions.block_id = blocks.id;

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

            ALTER TABLE transactions ADD CONSTRAINT "transactions_nonce"
            CHECK (check_transaction_nonce(version, id, sender_public_key, nonce, block_id, sequence));
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP TRIGGER transactions_set_nonce ON transactions;
            DROP FUNCTION set_row_nonce;
            ALTER TABLE transactions DROP CONSTRAINT "transactions_nonce";
            DROP FUNCTION check_transaction_nonce;
            DROP INDEX transactions_sender_nonce;
            ALTER TABLE transactions DROP COLUMN nonce;
        `);
    }
}
