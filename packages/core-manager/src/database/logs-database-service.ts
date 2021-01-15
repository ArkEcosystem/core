import { Container, Providers } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";

import { Database, Result, Schema } from "./database";

export interface LogsResult {
    id: number;
    process: string;
    level: string;
    content: string;
    timestamp: number;
}

export interface SearchParams {
    dateFrom?: number;
    dateTo?: number;
    searchTerm?: string;
    level?: string;
    process?: string;
    limit?: number;
    offset?: number;
    order?: string;
}

@Container.injectable()
export class LogsDatabaseService {
    @Container.inject(Container.Identifiers.ConfigFlags)
    private readonly configFlags!: any;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: Database;

    public getDBFilePath(): string {
        return this.configuration.getRequired<{ storage: string }>("logs").storage;
    }

    public getSchema(): Schema {
        return {
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
        };
    }

    public boot(): void {
        this.database = new Database(this.getDBFilePath(), this.getSchema());

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
        const conditions: any = {
            $order: { id: "DESC" },
        };

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

        if (searchParams.order && searchParams.order.toUpperCase() === "ASC") {
            conditions.$order.id = "ASC";
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
