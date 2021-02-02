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
}
