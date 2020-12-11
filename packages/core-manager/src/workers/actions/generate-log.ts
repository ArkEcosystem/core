export interface Options {
    databaseFilePath: string;
    logFilePath: string;
    query: any;
}

export class GenerateLog {
    public constructor(private readonly options: Options) {}

    public async execute(): Promise<void> {
        console.log(JSON.stringify(this.options));
    }
}
