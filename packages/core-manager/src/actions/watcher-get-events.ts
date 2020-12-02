import { Container } from "@arkecosystem/core-kernel";

import { Actions } from "../contracts";
import { EventsDatabaseService } from "../database/events-database-service";

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly database!: EventsDatabaseService;

    public name = "watcher.getEvents";

    public schema = {
        type: "object",
        properties: {
            query: {
                type: "object",
                properties: {
                    $limit: {
                        type: "number",
                        minimum: 0,
                    },
                    $offset: {
                        type: "number",
                        minimum: 0,
                    },
                },
            },
        },
        required: ["query"],
    };

    public async execute(params: { query: any }): Promise<any> {
        return this.database.find(params.query);
    }
}
