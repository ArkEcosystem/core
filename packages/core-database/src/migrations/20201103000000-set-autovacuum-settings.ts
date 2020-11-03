import { MigrationInterface, QueryRunner } from "typeorm";

export class SetAutovacuumSettings20201103000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE blocks SET (
                autovacuum_vacuum_scale_factor = 0,
                autovacuum_analyze_scale_factor = 0,
                autovacuum_vacuum_threshold = 10000,
                autovacuum_analyze_threshold = 10000
            );

            ALTER TABLE transactions SET (
                autovacuum_vacuum_scale_factor = 0,
                autovacuum_analyze_scale_factor = 0,
                autovacuum_vacuum_threshold = 10000,
                autovacuum_analyze_threshold = 10000
            );

            ALTER TABLE wallets SET (
                autovacuum_vacuum_scale_factor = 0,
                autovacuum_analyze_scale_factor = 0,
                autovacuum_vacuum_threshold = 10000,
                autovacuum_analyze_threshold = 10000
            );

            ALTER TABLE rounds SET (
                autovacuum_vacuum_scale_factor = 0,
                autovacuum_analyze_scale_factor = 0,
                autovacuum_vacuum_threshold = 10000,
                autovacuum_analyze_threshold = 10000
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            ALTER TABLE blocks SET (
                autovacuum_vacuum_scale_factor = 0.2,
                autovacuum_analyze_scale_factor = 0.1,
                autovacuum_vacuum_threshold = 50,
                autovacuum_analyze_threshold = 50
            );

            ALTER TABLE transactions SET (
                autovacuum_vacuum_scale_factor = 0.2,
                autovacuum_analyze_scale_factor = 0.1,
                autovacuum_vacuum_threshold = 50,
                autovacuum_analyze_threshold = 50
            );

            ALTER TABLE wallets SET (
                autovacuum_vacuum_scale_factor = 0.2,
                autovacuum_analyze_scale_factor = 0.1,
                autovacuum_vacuum_threshold = 50,
                autovacuum_analyze_threshold = 50
            );

            ALTER TABLE rounds SET (
                autovacuum_vacuum_scale_factor = 0.2,
                autovacuum_analyze_scale_factor = 0.1,
                autovacuum_vacuum_threshold = 50,
                autovacuum_analyze_threshold = 50
            );
        `);
    }
}
