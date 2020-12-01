import { Container, Providers } from "@arkecosystem/core-kernel";

import { Database, Result } from "./database";

interface SearchParams {
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    level?: string;
    process?: string;
    limit?: number;
    offset?: number;
}

@Container.injectable()
export class LogsDatabaseService {
    @Container.inject(Container.Identifiers.ConfigFlags)
    private readonly configFlags!: any;

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
                            name: "process",
                            type: "varchar(15)",
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
            process: this.configFlags.processType,
            level,
            content,
        });
    }

    public find(conditions?: any): Result {
        return this.database.find("logs", conditions);
    }

    public search(searchParams: SearchParams): Result {
        const conditions: any = {};

        if (searchParams.dateFrom || searchParams.dateTo) {
            conditions.timestamp = {};

            if (searchParams.dateFrom) {
                conditions.timestamp.$gte = searchParams.dateFrom;
            }

            if (searchParams.dateTo) {
                conditions.timestamp.$lte = searchParams.dateTo;
            }
        }

        return this.database.find("logs", conditions);
    }
}
