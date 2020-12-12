import { Application, Container } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import { join } from "path";

import { Actions } from "../contracts";
import { LogsDatabaseService } from "../database/logs-database-service";
import { Identifiers } from "../ioc";
import { WorkerManager } from "../workers/worker-manager";

interface Params {
    dateFrom: number;
    dateTo: number;
    levels: string[];
    processes?: string[];
}

@Container.injectable()
export class Action implements Actions.Action {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Application;

    @Container.inject(Identifiers.LogsDatabaseService)
    private readonly database!: LogsDatabaseService;

    @Container.inject(Identifiers.WorkerManager)
    private readonly workerManager!: WorkerManager;

    public name = "log.download";

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
            },
            processes: {
                type: "array",
            },
        },
        required: ["dateFrom", "dateTo", "levels"],
    };

    public async execute(params: Params): Promise<any> {
        const fileName = this.generateFileName();

        await this.workerManager.generateLog(
            this.database.getDBFilePath(),
            this.database.getSchema(),
            this.prepareQueryConditions(params),
            this.getLogFilePath(fileName),
        );

        return fileName;
    }

    private getLogFilePath(fileName: string): string {
        return join(this.app.dataPath(), "log-archive", fileName);
    }

    private generateFileName(): string {
        return dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".log.gz";
    }

    private prepareQueryConditions(params: Params): any {
        const query = {
            timestamp: {
                $lte: params.dateTo,
                $gte: params.dateFrom,
            },
            level: {
                $in: params.levels,
            },
            $order: {
                id: "ASC",
            },
        };

        if (params.processes) {
            // @ts-ignore
            query.process = {
                $in: params.processes,
            };
        }

        return query;
    }
}
