import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeneratorPublicKeyHeightIndexToBlocksTable20201117000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS blocks_generator_public_key_height ON blocks ("generator_public_key", "height");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            DROP INDEX blocks_generator_public_key_height;
        `);
    }
}
