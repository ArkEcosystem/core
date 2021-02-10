import { Application, Container } from "@arkecosystem/core-kernel";
import { Connection } from "typeorm";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    public name = "info.databaseSize";

    public async execute(): Promise<any> {
        return {
            size: await this.getDatabaseSize(),
        };
    }

    private async getDatabaseSize(): Promise<number> {
        const connection = this.app.get<Connection>(Container.Identifiers.DatabaseConnection);

        const result = await connection.query(`SELECT pg_database_size('${connection.options.database}');`);

        return Math.round(result[0].pg_database_size / 1024);
    }
}
