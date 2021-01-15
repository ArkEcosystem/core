import { Container } from "@arkecosystem/core-kernel";
import { Identifiers } from "../ioc";
import { LogsDatabaseService, SearchParams } from "../database/logs-database-service";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Identifiers.LogsDatabaseService)
    private readonly database!: LogsDatabaseService;

    public name = "log.search";

    public schema = {
        type: "object",
        properties: {
            dateFrom: {
                type: "number",
            },
            dateTo: {
                type: "number",
            },
            level: {
                type: "string",
            },
            process: {
                type: "string",
            },
            searchTerm: {
                type: "string",
            },
            limit: {
                type: "number",
            },
            offset: {
                type: "number",
            },
            order: {
                type: "string",
            },
        },
    };

    public async execute(params: SearchParams): Promise<any> {
        return this.database.search(params);
    }
}
