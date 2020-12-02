import { Container, Providers } from "@arkecosystem/core-kernel";

import { Database, Result } from "./database";

@Container.injectable()
export class EventsDatabaseService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: Database;

    public boot(): void {
        const filename = this.configuration.getRequired<{ storage: string }>("watcher").storage;

        this.database = new Database(filename, {
            tables: [
                {
                    name: "events",
                    columns: [
                        {
                            name: "id",
                            type: "integer",
                            primary: true,
                            autoincrement: true,
                        },
                        {
                            name: "event",
                            type: "varchar(255)",
                            index: true,
                        },
                        {
                            name: "data",
                            type: "json",
                            index: true,
                        },
                        {
                            name: "timestamp",
                            type: "datetime",
                            default: "CURRENT_TIMESTAMP",
                            index: true,
                        },
                    ],
                },
            ],
        });

        this.database.boot(this.configuration.getRequired<{ resetDatabase: boolean }>("watcher").resetDatabase);
    }

    public dispose(): void {
        this.database.dispose();
    }

    public add(event: string, data: any = {}): void {
        this.database.add("events", {
            event,
            data,
        });
    }

    public find(conditions?: any): Result {
        return this.database.find("events", conditions);
    }
}
