import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampIndexToBlocksTable20181204200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX "transactions_timestamp" ON transactions ("timestamp");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX "transactions_timestamp";
        `);
    }
}
