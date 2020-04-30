import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoundsTable20180305200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE rounds (
                "id" SERIAL PRIMARY KEY,
                "public_key" VARCHAR(66) NOT NULL,
                "balance" BIGINT NOT NULL,
                "round" BIGINT NOT NULL
            );

            CREATE UNIQUE INDEX "rounds_unique" ON rounds ("round", "public_key");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable("rounds");
    }
}
