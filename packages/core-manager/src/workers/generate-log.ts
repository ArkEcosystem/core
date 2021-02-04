import { createWriteStream, ensureDirSync, removeSync, renameSync } from "fs-extra";
import { dirname, join } from "path";
import { Writable } from "stream";

import { GenerateLog as GenerateLogContracts } from "../contracts";
import { Database } from "../database/database";

export class GenerateLog implements GenerateLogContracts.GenerateLog {
    protected readonly database: Database;

    public constructor(protected readonly options: GenerateLogContracts.GenerateLogOptions) {
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

    protected prepareOutputStream(): Writable {
        ensureDirSync(dirname(this.getTempFilePath()));

        return createWriteStream(this.getTempFilePath());
    }

    protected moveArchive(): void {
        ensureDirSync(dirname(this.getFilePath()));
        renameSync(this.getTempFilePath(), this.getFilePath());
    }

    protected removeTempFiles(): void {
        removeSync(this.getTempFilePath());
    }
}
