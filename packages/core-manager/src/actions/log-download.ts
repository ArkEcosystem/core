import { Application, Container } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import { createWriteStream, ensureDirSync, WriteStream } from "fs-extra";
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

        // await this.writeLogs(this.prepareOutputStream(fileName), this.prepareQueryConditions(params));

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

    // @ts-ignore
    private generateFileName(): string {
        return dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".log";
    }

    // @ts-ignore
    private prepareOutputStream(fileName: string): WriteStream {
        const dir = join(this.app.dataPath(), "log-archive");

        ensureDirSync(dir);

        const filePath = join(dir, fileName);

        console.log("FilePath: ", filePath);

        return createWriteStream(filePath);
    }

    // @ts-ignore
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

    // @ts-ignore
    private async writeLogs(stream: WriteStream, conditions: any): Promise<void> {
        const iterator = this.database.getAllIterator(conditions);

        console.log("Logs found");

        let i = 0;

        console.log("Before loop");

        for (const log of iterator) {
            if (i === 0) {
                console.log("Start");
                console.log(log);
            }

            stream.write(`${log.id} [${log.level.toUpperCase()}] ${log.content}\n`);

            await new Promise((resolve) => {
                if (i++ % 10000 === 0) {
                    console.log(log.id);

                    setImmediate(() => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }
    }
}

// Times
// imidiate every: 1 m 58 sec
// no imediate: 1 m 25 sec
// No async: 1 m 9 sec
// Paritioning: 55 sec

// Iterator: 33 sec
