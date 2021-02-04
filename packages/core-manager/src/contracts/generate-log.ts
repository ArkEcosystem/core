import { Schema } from "../database/database";

export interface GenerateLogOptions {
    archiveFormat: string;
    databaseFilePath: string;
    schema: Schema;
    logFileName: string;
    query: any;
}

export interface GenerateLog {
    execute(): Promise<void>;
}

export interface GenerateLogFactory {
    (options: GenerateLogOptions): GenerateLog;
}
