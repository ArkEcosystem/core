import { MigrationExecutor } from "typeorm";

import { getCoreDatabaseConnection } from "./__support__/app";

jest.setTimeout(30000);

test("migrations", async () => {
    const connection = await getCoreDatabaseConnection({ migrationsRun: false });

    const check = async () => {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            const migrationExecutor = new MigrationExecutor(connection, queryRunner);
            await migrationExecutor.executePendingMigrations();
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
        }
    };

    await expect(check()).resolves.toBeUndefined();
});
