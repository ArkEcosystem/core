import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeneratorPublicKeyIndexToBlocksTable20181204100000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX "blocks_generator_public_key" ON blocks ("generator_public_key");
        `);
    }

    async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX "blocks_unique";
        `);
    }
}
