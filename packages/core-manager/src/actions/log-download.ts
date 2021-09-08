import { Container } from "@arkecosystem/core-kernel";

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
                items: {
                    type: "string",
                },
            },
            processes: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        },
        required: ["dateFrom", "dateTo"],
    };

    public async execute(params: Params): Promise<any> {
        if (!this.workerManager.canRun()) {
            throw new Error("Previous log generation is still in progress.");
        }

        return this.workerManager.generateLog(
            this.database.getDBFilePath(),
            this.database.getSchema(),
            this.prepareQueryConditions(params),
        );
    }

    private prepareQueryConditions(params: Params): any {
        const query = {
            timestamp: {
                $lte: params.dateTo,
                $gte: params.dateFrom,
            },
            $order: {
                id: "ASC",
            },
        };

        if (params.levels) {
            // @ts-ignore
            query.level = {
                $in: params.levels,
            };
        }

        if (params.processes) {
            // @ts-ignore
            query.process = {
                $in: params.processes,
            };
        }

        return query;
    }
}
