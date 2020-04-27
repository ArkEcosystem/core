import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecipientIdIndexToTransactionsTable20181204400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX "transactions_recipient_id" ON transactions ("recipient_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX "transactions_recipient_id";
        `);
    }
}
