import { Container } from "@arkecosystem/core-kernel";
import { Logger, QueryRunner } from "typeorm";

import { EventsDatabaseService } from "./database/events-database-service";

@Container.injectable()
export class DatabaseLogger implements Logger {
    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly databaseService!: EventsDatabaseService;

    public log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.${level}`, message);
    }

    public logMigration(message: string, queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.migration`, message);
    }

    public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.query.log`, {
            query: query,
            parameters: parameters,
        });
    }

    public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.query.error`, {
            error: error,
            query: query,
            parameters: parameters,
        });
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.query.slow`, {
            time: time,
            query: query,
            parameters: parameters,
        });
    }

    public logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
        this.databaseService.add(`database.schemaBuild`, message);
    }
}
