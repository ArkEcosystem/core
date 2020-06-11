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
        // todo: this has to be grabbed from the container for the alias `database` or the manager will only work with official plugins
        return require("@arkecosystem/core-database/dist/defaults").defaults;
    }

    private getDatabaseName(): string {
        return this.getDatabaseDefaults().connection.database;
    }

    private async getDatabaseSize(): Promise<number> {
        const connection = await this.connect();

        try {
            const result = await connection.query(`SELECT pg_database_size('${this.getDatabaseName()}');`);

            return Math.round(result[0].pg_database_size / 1024);
        } finally {
            await connection.close();
        }
    }

    private async connect(): Promise<Connection> {
        return createConnection(this.getDatabaseDefaults().connection as ConnectionOptions);
    }
}
