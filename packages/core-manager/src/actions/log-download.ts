import { Application, Container } from "@arkecosystem/core-kernel";
import dayjs from "dayjs";
import { createWriteStream, ensureDirSync, WriteStream } from "fs-extra";
import { join } from "path";

// import { Identifiers } from "../ioc";
// import { LogsDatabaseService } from "../database/logs-database-service";
import { Actions } from "../contracts";

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

    // @Container.inject(Identifiers.LogsDatabaseService)
    // private readonly database!: LogsDatabaseService;

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

        this.writeLogs(this.prepareOutputStream(fileName));

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

    private writeLogs(stream: WriteStream): void {
        stream.write("Test");
    }
}
