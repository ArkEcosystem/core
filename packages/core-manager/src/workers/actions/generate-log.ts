import { createWriteStream, ensureDirSync, WriteStream } from "fs-extra";
import { dirname } from "path";

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
    }

    private formatLog(log: LogsResult): string {
        return `${log.id} [${log.level}] ${log.content}\n`;
    }

    private prepareOutputStream(): WriteStream {
        ensureDirSync(dirname(this.options.logFilePath));

        return createWriteStream(this.options.logFilePath);
    }
}
