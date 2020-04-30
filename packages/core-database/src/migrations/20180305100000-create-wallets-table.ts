import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletsTable20180305100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE wallets (
                "address" VARCHAR(36) PRIMARY KEY NOT NULL,
                "public_key" VARCHAR(66) UNIQUE NOT NULL,
                "second_public_key" VARCHAR(66) UNIQUE,
                "vote" VARCHAR(66),
                "username" VARCHAR(64) UNIQUE,
                "balance" BIGINT NOT NULL,
                "vote_balance" BIGINT NOT NULL,
                "produced_blocks" BIGINT NOT NULL,
                "missed_blocks" BIGINT NOT NULL
            );

            CREATE UNIQUE INDEX "wallets_votes_unique" ON wallets ("public_key", "vote");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable("wallets");
    }
}
