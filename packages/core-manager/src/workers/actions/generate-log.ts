import { join } from "path";
import { Writable } from "stream";

import { Database, Schema } from "../../database/database";

export interface Options {
    archiveFormat: string;
    databaseFilePath: string;
    schema: Schema;
    logFileName: string;
    query: any;
}

export class GenerateLog {
    protected readonly database: Database;

    public constructor(protected readonly options: Options) {
        this.database = new Database(options.databaseFilePath, options.schema);

        this.database.boot();
    }

    public async execute(): Promise<void> {}

    protected getFilePath(): string {
        return join(process.env.CORE_PATH_DATA!, "log-archive", this.options.logFileName);
    }

    protected getTempFilePath(): string {
        return join(process.env.CORE_PATH_TEMP!, "log-archive", this.options.logFileName);
    }

    protected resolveOnClose(stream: Writable): Promise<void> {
        return new Promise((resolve) => {
            stream.on("close", () => {
                resolve();
            });
        });
    }
}
