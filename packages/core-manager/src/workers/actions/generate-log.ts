import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, join } from "path";
import { Writable } from "stream";
import zlib from "zlib";

import { Database, Schema } from "../../database/database";
import { LogsResult } from "../../database/logs-database-service";

dayjs.extend(utc);

export interface Options {
    databaseFilePath: string;
    schema: Schema;
    logFileName: string;
    query: any;
}

export class GenerateLog {
    private readonly database: Database;

    public constructor(private readonly options: Options) {
        this.database = new Database(options.databaseFilePath, options.schema);

        this.database.boot();
    }

    public async execute(): Promise<void> {
        const iterator = this.database.getAllIterator("logs", this.options.query);

        const stream = this.prepareOutputStream();

        for (const log of iterator) {
            stream.write(this.formatLog(log));
        }

        await new Promise((resolve) => {
            stream.end(() => {
                resolve();
            });
        });

        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    private formatLog(log: LogsResult): string {
        return `[${dayjs.unix(log.timestamp).utc().format("YYYY-MM-DD HH:mm:ss.SSS")}] ${log.level.toUpperCase()} : ${
            log.content
        }\n`;
    }

    private getFilePath(): string {
        return join(process.env.CORE_PATH_DATA!, "log-archive", this.options.logFileName);
    }

    private getTempFilePath(): string {
        return join(process.env.CORE_PATH_TEMP!, "log-archive", this.options.logFileName);
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        const stream = zlib.createGzip();

        stream.pipe(createWriteStream(this.getTempFilePath()));

        return stream;
    }
}
