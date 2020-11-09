import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletsTable20201013000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE wallets (
                "address" VARCHAR(36) PRIMARY KEY NOT NULL,
                "public_key" VARCHAR(66) UNIQUE,
                "balance" BIGINT NOT NULL,
                "nonce" BIGINT NOT NULL,
                "attributes" JSONB NOT NULL
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP TABLE wallets;
        `);
    }
}
