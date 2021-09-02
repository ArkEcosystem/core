import { Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { LogsDatabaseService, SearchParams } from "../database/logs-database-service";
import { Identifiers } from "../ioc";

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
            levels: {
                type: "array",
                items: {
                    type: "string",
                },
            },
            processes: {
                type: "array",
                items: {
                    type: "string",
                },
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
        additionalProperties: false,
    };

    public async execute(params: SearchParams): Promise<any> {
        return this.database.search(params);
    }
}
