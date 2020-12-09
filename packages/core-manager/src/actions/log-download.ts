import { Application, Container } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import { createWriteStream, ensureDirSync, WriteStream } from "fs-extra";
import { join } from "path";

import { Actions } from "../contracts";
import { LogsDatabaseService } from "../database/logs-database-service";
import { Identifiers } from "../ioc";

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

        this.writeLogs(this.prepareOutputStream(fileName), this.prepareQueryConditions(params));

        return fileName;
    }

    private generateFileName(): string {
        return dayjs().format("YYYY-MM-DD_HH-mm-ss") + ".log";
    }

    private prepareOutputStream(fileName: string): WriteStream {
        const dir = join(this.app.dataPath(), "log-archive");

        ensureDirSync(dir);

        const filePath = join(dir, fileName);

        return createWriteStream(filePath);
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

    private writeLogs(stream: WriteStream, conditions: any): void {
        for (const log of this.database.getAll(conditions)) {
            stream.write(`${log.id} [${log.level.toUpperCase()}] ${log.content}\n`);
        }
    }
}
