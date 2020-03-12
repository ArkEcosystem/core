import { createConnection, MigrationExecutor } from "typeorm";

import { SnakeNamingStrategy } from "../../../packages/core-database/src/models/naming-strategy";
import { getCoreDatabasePluginConfiguration } from "./__support__/app";

jest.setTimeout(30000);

test("migrations undo and execute", async () => {
    const configuration = await getCoreDatabasePluginConfiguration();
    const connection = await createConnection({
        ...configuration.getRequired<any>("connection"),
        namingStrategy: new SnakeNamingStrategy(),
        migrations: [`${__dirname}/../../../packages/core-database/src/migrations/*.ts`],
        migrationsRun: false,
    });

    const queryRunner = connection.createQueryRunner();
    await queryRunner.startTransaction();
    const migrationExecutor = new MigrationExecutor(connection, queryRunner);

    const check = async () => {
        try {
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
        }
    };

    await expect(check()).resolves.not.toThrow();
});
