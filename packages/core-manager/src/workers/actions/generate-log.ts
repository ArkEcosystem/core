import { createWriteStream, ensureDirSync } from "fs-extra";
import { dirname } from "path";
import { Writable } from "stream";
import zlib from "zlib";

import { Database, Schema } from "../../database/database";
import { LogsResult } from "../../database/logs-database-service";

export interface Options {
    databaseFilePath: string;
    schema: Schema;
    logFilePath: string;
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

        stream.end();
    }

    private formatLog(log: LogsResult): string {
        return `${log.id} [${log.level}] ${log.content}\n`;
    }

    private prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.options.logFilePath));

        const stream = zlib.createGzip();

        stream.pipe(createWriteStream(this.options.logFilePath));

        return stream;
    }
}
