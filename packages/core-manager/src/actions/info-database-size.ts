import { Container, Providers } from "@arkecosystem/core-kernel";
import { Connection, ConnectionOptions, createConnection } from "typeorm";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.databaseSize";

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    public async execute(): Promise<any> {
        return {
            size: await this.getDatabaseSize(),
        };
    }

    private getDatabaseName(): string {
        // @ts-ignore
        return this.configuration.get("connection").database;
    }

    private async getDatabaseSize(): Promise<string> {
        const connection = await this.connect();

        try {
            const result = await connection.query(
                `SELECT pg_size_pretty( pg_database_size('${this.getDatabaseName()}'));`,
            );
            return result[0].pg_size_pretty;
        } finally {
            await connection.close();
        }
    }

    private async connect(): Promise<Connection> {
        return createConnection(this.configuration.get("connection") as ConnectionOptions);
    }
}
