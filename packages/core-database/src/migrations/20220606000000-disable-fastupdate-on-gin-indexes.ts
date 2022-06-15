import { MigrationInterface, QueryRunner } from "typeorm";

export class DisableFastupdateOnGinIndexes20220606000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
        DROP INDEX IF EXISTS transactions_asset;
        DROP INDEX IF EXISTS transactions_asset_payments;
        CREATE INDEX transactions_asset ON transactions USING GIN(asset) WITH (fastupdate = off);
        CREATE INDEX transactions_asset_payments ON transactions USING GIN ((asset->'payments')) WITH (fastupdate = off);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
        DROP INDEX IF EXISTS transactions_asset;
        DROP INDEX IF EXISTS transactions_asset_payments;
        CREATE INDEX transactions_asset ON transactions USING GIN(asset);
        CREATE INDEX transactions_asset_payments ON transactions USING GIN ((asset->'payments'));
        `);
    }
}
