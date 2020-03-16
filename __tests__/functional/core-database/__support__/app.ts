import { Container, Providers } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Interfaces } from "@arkecosystem/crypto";
import { Connection, createConnection } from "typeorm";

import { Block } from "../../../../packages/core-database/src/models/block";
import { SnakeNamingStrategy } from "../../../../packages/core-database/src/models/naming-strategy";

export const getCoreDatabasePluginConfiguration = async (): Promise<Providers.PluginConfiguration> => {
    const sandbox: Sandbox = new Sandbox();
    await sandbox.boot(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
                processType: "core",
            },
            plugins: {
                include: ["@arkecosystem/core-database"],
            },
        });
    });

    const serviceProviderRepository = sandbox.app.get<Providers.ServiceProviderRepository>(
        Container.Identifiers.ServiceProviderRepository,
    );
    const databaseServiceProvider = serviceProviderRepository.get("@arkecosystem/core-database");
    return databaseServiceProvider.config();
};

export const getCoreDatabaseConnection = async (options = {}): Promise<Connection> => {
    const configuration = await getCoreDatabasePluginConfiguration();
    const connection = await createConnection({
        ...configuration.getRequired<any>("connection"),
        namingStrategy: new SnakeNamingStrategy(),
        migrations: [`${__dirname}/../../../../packages/core-database/src/migrations/*.ts`],
        entities: [`${__dirname}/../../../../packages/core-database/src/models/*.ts`],
        migrationsRun: true,
        ...options,
    });
    return connection;
};

export const clearCoreDatabase = async (connection: Connection) => {
    await connection.query("TRUNCATE TABLE blocks, rounds, transactions RESTART IDENTITY");
};

export const toBlock = (blockData: Interfaces.IBlockData): Block => {
    const clone = Object.assign({}, blockData);
    delete clone.idHex;
    delete clone.previousBlockHex;
    const block = new Block();
    Object.assign(block, clone);
    return block;
};
