import { Container } from "@arkecosystem/core-kernel";
import { Connection, ConnectionOptions, createConnection } from "typeorm";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "info.databaseSize";

    public async execute(): Promise<any> {
        return {
            size: await this.getDatabaseSize(),
        };
    }

    private getDatabaseDefaults() {
        return require("@arkecosystem/core-database/dist/defaults").defaults;
    }

    private getDatabaseName(): string {
        return this.getDatabaseDefaults().connection.database;
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
        return createConnection(this.getDatabaseDefaults().connection as ConnectionOptions);
    }
}
