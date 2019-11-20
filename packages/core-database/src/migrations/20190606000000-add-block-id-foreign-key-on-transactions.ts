import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockIdForeignKeyOnTransactionsTable20190606000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions ADD CONSTRAINT "transactions_block_id_fkey" FOREIGN KEY (block_id) REFERENCES blocks (id);
        `);
    }

    async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE transactions DROP CONSTRAINT "transactions_block_id_fkey";
        `);
    }
}
