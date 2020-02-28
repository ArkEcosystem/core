import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSenderPublicKeyIndexToTransactionsTable20181204300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX "transactions_sender_public_key" ON transactions ("sender_public_key");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX "transactions_sender_public_key";
        `);
    }
}
