import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeGroupColumnToTransactionsTable20190803000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions ADD COLUMN type_group INTEGER NOT NULL DEFAULT 1;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions DROP COLUMN type_group;
        `);
    }
}
