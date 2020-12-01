import { Container, Providers } from "@arkecosystem/core-kernel";

import { Database, Result } from "./database";

@Container.injectable()
export class LogsDatabaseService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: Database;

    public boot(): void {
        const filename = this.configuration.getRequired<{ storage: string }>("logs").storage;
        // `${process.env.CORE_PATH_DATA}/logs.sqlite`; TODO: Check

        this.database = new Database(filename, {
            tables: [
                {
                    name: "logs",
                    columns: [
                        {
                            name: "id",
                            type: "integer",
                            primary: true,
                            autoincrement: true,
                        },
                        {
                            name: "level",
                            type: "varchar(15)",
                        },
                        {
                            name: "content",
                            type: "text",
                        },
                        {
                            name: "timestamp",
                            type: "datetime",
                            default: "CURRENT_TIMESTAMP",
                        },
                    ],
                },
            ],
        });

        // TODO: Check if requires flush
        this.database.boot(this.configuration.getRequired<{ resetDatabase: boolean }>("watcher").resetDatabase);
    }

    public dispose(): void {
        this.database.dispose();
    }

    public add(level: string, content: string): void {
        this.database.add("logs", {
            level,
            content,
        });
    }

    public find(conditions?: any): Result {
        return this.database.find("logs", conditions);
    }
}
