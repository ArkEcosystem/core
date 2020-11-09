import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetPaymentsIndexToTransactionsTable20201102000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS transactions_asset_payments ON transactions USING GIN ((asset->'payments'));
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX transactions_asset_payments;
        `);
    }
}
