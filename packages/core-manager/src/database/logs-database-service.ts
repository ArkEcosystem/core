import { Container, Providers } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";

import { Database, Result } from "./database";

export interface SearchParams {
    dateFrom?: number;
    dateTo?: number;
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
                            index: true,
                        },
                        {
                            name: "level",
                            type: "varchar(15)",
                            index: true,
                        },
                        {
                            name: "content",
                            type: "text",
                        },
                        {
                            name: "timestamp",
                            type: "integer",
                            index: true,
                        },
                    ],
                },
            ],
        });

        this.database.boot(this.configuration.getRequired<{ resetDatabase: boolean }>("logs").resetDatabase);
    }

    public dispose(): void {
        this.database.dispose();
    }

    public add(level: string, content: string): void {
        if (!this.database.isOpen()) {
            return;
        }

        this.database.add("logs", {
            process: this.configFlags.processType,
            level,
            content,
            timestamp: dayjs().unix(),
        });

        this.removeOldRecords();
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

        if (searchParams.level) {
            conditions.level = searchParams.level;
        }

        if (searchParams.process) {
            conditions.process = searchParams.process;
        }

        if (searchParams.searchTerm) {
            conditions.content = {
                $like: `%${searchParams.searchTerm}%`,
            };
        }

        if (searchParams.limit) {
            conditions.$limit = searchParams.limit;
        }

        if (searchParams.offset) {
            conditions.$offset = searchParams.offset;
        }

        return this.database.find("logs", conditions);
    }

    private removeOldRecords() {
        this.database.remove("logs", {
            timestamp: {
                $lte:
                    dayjs().unix() - this.configuration.getRequired<{ history: number }>("logs").history * 24 * 60 * 60,
            },
        });
    }
}
