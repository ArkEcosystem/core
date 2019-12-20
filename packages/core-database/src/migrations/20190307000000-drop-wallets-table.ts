import { MigrationInterface, QueryRunner } from "typeorm";

export class DropWalletsTable20190307000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropTable("wallets");
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
