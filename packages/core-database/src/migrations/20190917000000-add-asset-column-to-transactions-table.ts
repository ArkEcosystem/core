import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssetColumnToTransactionsTable20190917000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions ADD COLUMN asset JSONB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions DROP COLUMN asset;
        `);
    }
}
