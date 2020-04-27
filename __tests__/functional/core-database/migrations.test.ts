import { MigrationExecutor } from "typeorm";

import { getCoreDatabaseConnection } from "./__support__";

jest.setTimeout(30000);

test("migrations", async () => {
    const check = async () => {
        const connection = await getCoreDatabaseConnection({ migrationsRun: false });
        const queryRunner = connection.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            const migrationExecutor = new MigrationExecutor(connection, queryRunner);
            for (;;) {
                const executedMigrations = await migrationExecutor.getExecutedMigrations();
                if (executedMigrations.length === 0) {
                    break;
                }
                await migrationExecutor.undoLastMigration();
            }
            await migrationExecutor.executePendingMigrations();
        } finally {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            await connection.close();
        }
    };

    await expect(check()).resolves.toBeUndefined();
});
