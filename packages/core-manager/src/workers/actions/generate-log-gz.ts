import dayjs from "dayjs";
import { createWriteStream, ensureDirSync, renameSync } from "fs-extra";
import { dirname, join } from "path";
import { Writable } from "stream";
import zlib from "zlib";

import { LogsResult } from "../../database/logs-database-service";
import { GenerateLog, Options } from "./generate-log";

export class GenerateLogGz extends GenerateLog {
    public constructor(options: Options) {
        super(options);
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

        ensureDirSync(dirname(this.getFilePath()));
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
