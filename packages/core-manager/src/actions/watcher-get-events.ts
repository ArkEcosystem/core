import { Container } from "@arkecosystem/core-kernel";
import { DatabaseService } from "../database-service";

import { Actions } from "../contracts";

@Container.injectable()
export class Action implements Actions.Action {
    public name = "watcher.getEvents";

    public schema = {
        type: "object",
        properties: {
            query: {
                type: "object",
                properties: {
                    limit: {
                        type: "number",
                        minimum: 0
                    },
                    offset: {
                        type: "number",
                        minimum: 0
                    },
                    event: {
                        type: "string",
                    }
                }
            },
        },
        required: ["query"],
    };

    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly database!: DatabaseService;

    public async execute(params: { query: any }): Promise<any> {
        return this.database.queryEvents(params.query);
    }
}
