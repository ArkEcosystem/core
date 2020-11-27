import { Container } from "@arkecosystem/core-kernel";
import { Logger, QueryRunner } from "typeorm";

import { DatabaseService } from "./database/database-service";

@Container.injectable()
export class DatabaseLogger implements Logger {
    @Container.inject(Container.Identifiers.WatcherDatabaseService)
    private readonly databaseService!: DatabaseService;

    public log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.${level}`, message);
    }

    public logMigration(message: string, queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.migration`, message);
    }

    public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.query.log`, {
            query: query,
            parameters: parameters,
        });
    }

    public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.query.error`, {
            error: error,
            query: query,
            parameters: parameters,
        });
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.query.slow`, {
            time: time,
            query: query,
            parameters: parameters,
        });
    }

    public logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
        this.databaseService.addEvent(`database.schemaBuild`, message);
    }
}
