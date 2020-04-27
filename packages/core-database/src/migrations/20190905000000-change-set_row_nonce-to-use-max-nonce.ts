import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSetRowNonceToUseMaxNonce20190905000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP TRIGGER transactions_set_nonce ON transactions;

            DROP FUNCTION set_row_nonce();

            CREATE FUNCTION set_row_nonce() RETURNS TRIGGER
            AS
            $$
            BEGIN
                SELECT COALESCE(MAX(nonce), 0) + 1 INTO NEW.nonce
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
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
